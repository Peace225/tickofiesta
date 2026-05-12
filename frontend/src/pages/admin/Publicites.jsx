import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import {
  Megaphone, Plus, Eye, MousePointer, Trash2,
  Edit, Power, Image as ImageIcon, Link as LinkIcon, 
  Calendar, Upload, Activity, RefreshCw, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Publicites() {
  const { dark } = useSelector((s) => s.theme);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const debounceTimer = useRef(null);

  const [formData, setFormData] = useState({
    titre: '', description: '', image: '', lien: '',
    position: 'home_banner', actif: true, date_debut: '', date_fin: ''
  });

  // Palette Institutionnelle / Régie Publicitaire
  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20',
  };

  const positions = [
    { value: 'home_banner', label: 'Bannière Accueil (Hero)' },
    { value: 'events_top', label: 'En-tête Événements' },
    { value: 'sidebar', label: 'Colonne Latérale' },
    { value: 'popup', label: 'Fenêtre Surgissante (Popup)' },
  ];

  const loadAds = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsUpdating(true);

    try {
      const { data, error } = await supabase
        .from('publicites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Erreur de chargement des campagnes');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, []);

  // WebSockets Temps Réel
  useEffect(() => {
    loadAds();

    const debouncedRefresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => loadAds(true), 500); 
    };

    const channel = supabase.channel('realtime_publicites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'publicites' }, debouncedRefresh)
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [loadAds]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return toast.error('Fichier trop lourd. Maximum 5MB.');
    if (!file.type.startsWith('image/')) return toast.error('Format invalide. JPG, PNG ou WEBP requis.');

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `publicites/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('publicites').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('publicites').getPublicUrl(filePath);

      setFormData({ ...formData, image: data.publicUrl });
      setImagePreview(data.publicUrl);
      toast.success('Ressource importée avec succès');
    } catch (err) {
      toast.error('Échec du téléversement');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessingId('create');
    const loader = toast.loading(editingAd ? 'Mise à jour...' : 'Lancement de la campagne...');

    try {
      const payload = {
        ...formData,
        date_debut: formData.date_debut || null,
        date_fin: formData.date_fin || null,
        clicks: editingAd?.clicks || 0,
        impressions: editingAd?.impressions || 0
      };

      if (editingAd) {
        const { error } = await supabase.from('publicites').update(payload).eq('id', editingAd.id);
        if (error) throw error;
        toast.success('Campagne actualisée', { id: loader });
      } else {
        const { error } = await supabase.from('publicites').insert([payload]);
        if (error) throw error;
        toast.success('Nouvelle campagne déployée', { id: loader });
      }

      setShowModal(false);
      setEditingAd(null);
    } catch (err) {
      toast.error('Erreur lors du déploiement', { id: loader });
    } finally {
      setProcessingId(null);
    }
  };

  // ✅ OPTIMISTIC UI : Changement d'état instantané sans attendre le serveur
  const handleToggleActive = async (ad) => {
    const newStatus = !ad.actif;
    
    // Mise à jour immédiate de l'interface
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, actif: newStatus } : a));
    
    try {
      const { error } = await supabase.from('publicites').update({ actif: newStatus }).eq('id', ad.id);
      if (error) throw error;
      toast.success(newStatus ? 'Campagne en ligne' : 'Diffusion suspendue', { icon: newStatus ? '🟢' : '⏸️' });
    } catch (err) {
      // Annulation si erreur serveur
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, actif: !newStatus } : a));
      toast.error('Erreur de communication avec le serveur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmez-vous la suppression définitive de cette campagne ?')) return;
    setProcessingId(id);
    const loader = toast.loading('Suppression...');
    try {
      const { error } = await supabase.from('publicites').delete().eq('id', id);
      if (error) throw error;
      toast.success('Campagne supprimée du registre', { id: loader });
    } catch (err) {
      toast.error('Erreur lors de la suppression', { id: loader });
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setFormData({
      titre: ad.titre, description: ad.description || '', image: ad.image,
      lien: ad.lien, position: ad.position, actif: ad.actif,
      date_debut: ad.date_debut ? ad.date_debut.split('T')[0] : '',
      date_fin: ad.date_fin ? ad.date_fin.split('T')[0] : ''
    });
    setImagePreview(ad.image);
    setShowModal(true);
  };

  const StatusBadge = ({ actif, date_debut, date_fin }) => {
    const now = new Date();
    const debut = date_debut ? new Date(date_debut) : null;
    const fin = date_fin ? new Date(date_fin) : null;

    if (!actif) return <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-slate-500/10 text-slate-400 border-slate-500/20 backdrop-blur-md">Suspendu</span>;
    if (debut && now < debut) return <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 backdrop-blur-md">Planifié</span>;
    if (fin && now > fin) return <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-rose-500/10 text-rose-400 border-rose-500/20 backdrop-blur-md">Expiré</span>;
    
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En ligne
      </span>
    );
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
        
        {/* --- HEADER RÉGIE PUB --- */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-transparent to-emerald-500/10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
                <Megaphone size={14} className="text-indigo-400" />
                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Régie Publicitaire</span>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                {isUpdating ? <RefreshCw size={10} className="text-emerald-400 animate-spin" /> : <Activity size={10} className={`${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />}
                <span className={`text-[9px] font-bold tracking-widest uppercase ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>{isUpdating ? "Sync..." : isLive ? "Live" : "Hors ligne"}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Gestion des <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Campagnes</span>
            </h1>
            <p className="text-white/50 text-sm font-medium tracking-wide">
              {ads.length} campagne(s) configurée(s) dans le réseau.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={() => {
                setEditingAd(null); setImagePreview('');
                setFormData({ titre: '', description: '', image: '', lien: '', position: 'home_banner', actif: true, date_debut: '', date_fin: '' });
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
            >
              <Plus size={16} strokeWidth={3} /> Nouvelle Campagne
            </button>
          </div>
        </div>

        {/* --- KPI SECTION --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 relative">
          {isUpdating && <div className="absolute inset-0 z-50 bg-black/5 dark:bg-white/5 backdrop-blur-[1px] rounded-[2rem] transition-all" />}
          {[
            { label: 'Inventaire Total', value: ads.length, icon: Megaphone, color: '#6366f1' },
            { label: 'Diffusions Actives', value: ads.filter(a => a.actif).length, icon: Power, color: '#10b981' },
            { label: 'Trafic Généré (Clics)', value: ads.reduce((acc, a) => acc + (a.clicks || 0), 0), icon: MousePointer, color: '#f5a623' },
          ].map((stat, idx) => (
            <div key={idx} className={`group p-6 rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 hover:border-white/10 ${theme.card}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={20} strokeWidth={2} />
              </div>
              <p className={`text-3xl font-black tracking-tighter ${theme.text}`}>{stat.value.toLocaleString('fr-FR')}</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${theme.sub}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* --- LISTE DES PUBLICITÉS --- */}
        {loading && ads.length === 0 ? (
          <div className="flex justify-center items-center py-32"><Spinner size="xl" className="border-indigo-500 border-t-emerald-400" /></div>
        ) : ads.length === 0 ? (
          <div className={`py-32 text-center rounded-[2rem] border transition-colors ${dark ? 'border-white/5 bg-[#0A0A12]' : 'border-indigo-50 bg-white'}`}>
            <div className="w-24 h-24 bg-indigo-500/5 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/10"><Sparkles size={40} /></div>
            <p className={`text-2xl font-black tracking-tighter ${theme.text}`}>Espace vierge</p>
            <p className={`text-sm mt-2 font-medium ${theme.sub}`}>Créez votre première campagne pour monétiser l'audience.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ads.map(ad => (
              <div key={ad.id} className={`flex flex-col rounded-[2rem] border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-indigo-500/30 ${theme.card}`}>
                
                {/* Image Banner */}
                <div className="relative h-56 bg-[#0A0A12] border-b border-white/5 flex-shrink-0 group">
                  {ad.image ? (
                    <img src={ad.image} alt={ad.titre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/20 to-[#0A0A12]"><ImageIcon size={48} className="text-white/10" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4"><StatusBadge actif={ad.actif} date_debut={ad.date_debut} date_fin={ad.date_fin} /></div>
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="text-2xl font-black text-white drop-shadow-lg truncate tracking-tight">{ad.titre}</h3>
                  </div>
                </div>

                {/* Content & Stats */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  {ad.description && <p className={`text-sm leading-relaxed line-clamp-2 ${theme.sub}`}>{ad.description}</p>}

                  <div className={`grid grid-cols-3 gap-3 p-4 rounded-2xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex flex-col gap-1.5 border-r border-inherit border-opacity-50">
                      <span className={`text-[9px] uppercase font-black tracking-widest flex items-center gap-1 ${theme.sub}`}><Eye size={12} className="text-indigo-500"/> Impressions</span>
                      <span className={`text-lg font-black ${theme.text}`}>{ad.impressions?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 border-r border-inherit border-opacity-50 pl-2">
                      <span className={`text-[9px] uppercase font-black tracking-widest flex items-center gap-1 ${theme.sub}`}><MousePointer size={12} className="text-emerald-500"/> Clics</span>
                      <span className={`text-lg font-black ${theme.text}`}>{ad.clicks?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pl-2">
                      <span className={`text-[9px] uppercase font-black tracking-widest flex items-center gap-1 ${theme.sub}`}><Calendar size={12} className="text-amber-500"/> Zone</span>
                      <span className={`text-xs font-bold mt-1 truncate ${theme.text}`}>{positions.find(p => p.value === ad.position)?.label || 'Général'}</span>
                    </div>
                  </div>

                  {ad.lien && (
                    <a href={ad.lien} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 truncate transition-colors`}>
                      <LinkIcon size={14} /> {ad.lien}
                    </a>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-inherit border-opacity-10">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`flex-1 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                        ad.actif
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-black'
                          : dark ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                      }`}
                    >
                      {ad.actif ? 'Suspendre' : 'Diffuser'}
                    </button>
                    <button onClick={() => openEditModal(ad)} className={`px-5 py-3.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all`} title="Éditer la campagne">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(ad.id)} disabled={processingId === ad.id} className={`px-5 py-3.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50`} title="Supprimer la campagne">
                      {processingId === ad.id ? <Spinner size="sm" className="border-rose-500" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL CRÉATION / ÉDITION --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl rounded-[2rem] border shadow-2xl ${theme.card} max-h-[90vh] flex flex-col overflow-hidden`}>
            
            <div className="p-8 border-b border-inherit border-opacity-10 bg-[#0A0A12]/50">
              <h2 className={`text-2xl font-black tracking-tight ${theme.text}`}>
                {editingAd ? 'Configuration de la Campagne' : 'Nouvelle Campagne Publicitaire'}
              </h2>
              <p className={`text-sm mt-2 ${theme.sub}`}>Configurez les paramètres de diffusion de votre annonce.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div>
                <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Titre de l'annonce <span className="text-rose-500">*</span></label>
                <input type="text" required value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.input}`} placeholder="Ex: Promotion Spéciale Été" />
              </div>

              <div>
                <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Description & Sous-titre</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-medium focus:outline-none transition-all resize-none shadow-inner ${theme.input}`} placeholder="Accroche textuelle affichée sous la bannière..." />
              </div>

              <div className={`p-6 rounded-2xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`text-[10px] font-black uppercase tracking-[0.1em] mb-4 block ${theme.text}`}>Création Visuelle <span className="text-rose-500">*</span></label>
                
                {(imagePreview || formData.image) && (
                  <div className="mb-4 relative h-48 rounded-xl overflow-hidden border border-white/10 shadow-lg group">
                    <img src={imagePreview || formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2"><ImageIcon size={16}/> Image chargée</span>
                    </div>
                  </div>
                )}

                <label className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border text-sm font-black uppercase tracking-widest cursor-pointer transition-all ${dark ? 'bg-[#0A0A12] border-indigo-500/30 text-indigo-400 hover:border-indigo-500' : 'bg-white border-indigo-200 text-indigo-600 hover:border-indigo-400'}`}>
                  {uploading ? <Spinner size="sm" className="border-indigo-500" /> : <Upload size={18} />}
                  {uploading ? 'Traitement en cours...' : 'Téléverser un fichier'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
                
                <div className="flex items-center gap-4 my-5 opacity-50">
                  <div className="flex-1 h-px bg-current"></div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Ou via URL distante</span>
                  <div className="flex-1 h-px bg-current"></div>
                </div>

                <input type="url" value={formData.image} onChange={(e) => { setFormData({ ...formData, image: e.target.value }); setImagePreview(e.target.value); }} className={`w-full px-5 py-4 rounded-xl border text-sm font-medium focus:outline-none transition-all shadow-inner ${theme.input}`} placeholder="https://cdn.example.com/banner.webp" />
              </div>

              <div>
                <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Lien de redirection (CTA) <span className="text-rose-500">*</span></label>
                <input type="url" required value={formData.lien} onChange={(e) => setFormData({ ...formData, lien: e.target.value })} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-medium focus:outline-none transition-all shadow-inner ${theme.input}`} placeholder="https://www.annonceur.com/promo" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Emplacement cible</label>
                  <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer shadow-inner ${theme.input}`}>
                    {positions.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Statut Immédiat</label>
                  <select value={formData.actif} onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'true' })} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer shadow-inner ${theme.input}`}>
                    <option value="true">Déploiement Actif</option>
                    <option value="false">En Pause / Brouillon</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Lancement automatique</label>
                  <input type="date" value={formData.date_debut} onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-medium focus:outline-none transition-all shadow-inner ${theme.input}`} />
                </div>
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Fin de campagne</label>
                  <input type="date" value={formData.date_fin} onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-medium focus:outline-none transition-all shadow-inner ${theme.input}`} />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-inherit border-opacity-10 bg-[#0A0A12]/50 flex gap-4">
              <button type="button" onClick={() => { setShowModal(false); setEditingAd(null); setImagePreview(''); }} className={`flex-1 px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
                Annuler
              </button>
              <button type="submit" onClick={handleSubmit} disabled={processingId === 'create' || uploading} className="flex-[2] px-6 py-4 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {processingId === 'create' ? <Spinner size="sm" className="border-white" /> : (editingAd ? 'Enregistrer les modifications' : 'Déployer la campagne')}
              </button>
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}