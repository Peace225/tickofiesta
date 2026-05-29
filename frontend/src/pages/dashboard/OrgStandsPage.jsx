import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { 
  Plus, ImageIcon, Loader2, MapPin, Tag, 
  Ruler, X, Type, DollarSign, Store, Info, UploadCloud,
  Edit2, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgStandsPage() {
  const user = useSelector(s => s.auth.user);
  const { dark } = useSelector(s => s.theme);
  const fileRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [stands, setStands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    nom: '', description: '', prix_location: '', taille_m2: '', emplacement: '', type: 'standard', image_url: ''
  });

  useEffect(() => { if (user?.id) fetchEvents(); }, [user?.id]);
  useEffect(() => { fetchStands(); }, [selectedEvent, user?.id]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('id, titre').eq('organisateur_id', user.id);
    setEvents(data || []);
  };

  const fetchStands = async () => {
    if (!user?.id || !selectedEvent) { setStands([]); return; }
    let query = supabase.from('stands').select('*').eq('organisateur_id', user.id);
    query = selectedEvent === 'none' ? query.is('event_id', null) : query.eq('event_id', selectedEvent);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) toast.error("Erreur chargement stands");
    else setStands(data || []);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ nom: '', description: '', prix_location: '', taille_m2: '', emplacement: '', type: 'standard', image_url: '' });
    setPreview(null);
    setFile(null);
  };

  const handleEdit = (stand) => {
    setForm({
      nom: stand.nom || '',
      description: stand.description || '',
      prix_location: stand.prix_location || '',
      taille_m2: stand.taille_m2 || '',
      emplacement: stand.emplacement || '',
      type: stand.type || 'standard',
      image_url: stand.image_url || ''
    });
    setPreview(stand.image_url || null);
    setEditingId(stand.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce stand ? Cette action est irréversible.")) return;

    try {
      const { error } = await supabase.from('stands').delete().eq('id', id);
      if (error) throw error;
      toast.success("Stand supprimé avec succès !");
      fetchStands();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) return toast.error("Image trop lourde (Max 5Mo)");
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return toast.error("Sélectionnez un événement");
    
    setLoading(true);
    try {
      let finalImageUrl = form.image_url;
      
      // Si une nouvelle image a été sélectionnée, on l'upload
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: upErr } = await supabase.storage.from('stands').upload(fileName, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('stands').getPublicUrl(fileName);
        finalImageUrl = data.publicUrl;
      }

      const standData = {
        nom: form.nom,
        description: form.description || null,
        type: form.type,
        prix_location: form.prix_location ? parseFloat(form.prix_location) : 0,
        taille_m2: form.taille_m2 ? parseFloat(form.taille_m2) : null,
        emplacement: form.emplacement || null,
        event_id: selectedEvent === 'none' ? null : selectedEvent,
        organisateur_id: user.id,
        image_url: finalImageUrl,
        statut: 'disponible'
      };

      if (editingId) {
        // Mode Modification
        const { error: updateErr } = await supabase.from('stands').update(standData).eq('id', editingId);
        if (updateErr) throw updateErr;
        toast.success('Stand modifié avec succès !');
      } else {
        // Mode Création
        const { error: insertErr } = await supabase.from('stands').insert([standData]);
        if (insertErr) throw insertErr;
        toast.success('Stand ajouté avec succès !');
      }

      resetForm();
      fetchStands();
    } catch (err) {
      console.error(err);
      toast.error("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 💎 Configuration du Thème
  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#030305]' : 'bg-[#f8f9fa]',
    card: dark ? 'bg-[#0f0f13] border-white/[0.05] shadow-2xl' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark 
      ? 'bg-black/40 border-white/10 text-white focus:border-violet-500' 
      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-violet-500',
    label: dark ? 'text-slate-300' : 'text-slate-700',
  }), [dark]);

  return (
    <div className={`min-h-screen pt-6 pb-24 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${theme.bg}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${theme.text}`}>Espace Exposants</h1>
            <p className={`text-xs md:text-sm mt-1 uppercase tracking-widest font-bold ${theme.sub}`}>Gestion des stands et emplacements</p>
          </div>
          <button 
            onClick={() => showForm ? resetForm() : setShowForm(true)} 
            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-[0_10px_20px_-10px_rgba(108,71,255,0.5)] hover:-translate-y-0.5"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Annuler' : 'Nouveau Stand'}
          </button>
        </div>
        
        {/* FILTRE CONTEXTE */}
        <div className={`p-4 rounded-2xl border mb-8 flex flex-col sm:flex-row items-center gap-4 ${theme.card}`}>
          <div className="w-full sm:w-1/3">
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${theme.sub}`}>Contexte d'affichage</label>
            <select 
              className={`w-full p-3 rounded-xl border outline-none font-semibold text-sm appearance-none cursor-pointer transition-all ${theme.input}`} 
              value={selectedEvent} 
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                resetForm();
              }}
            >
              <option value="">Sélectionnez un événement</option>
              <option value="none">Stands permanents (Hors événement)</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.titre}</option>)}
            </select>
          </div>
          {!selectedEvent && (
            <div className="w-full sm:w-2/3 flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-sm font-medium">
              <Info size={16} className="shrink-0" />
              Sélectionnez un événement pour voir ou ajouter des stands.
            </div>
          )}
        </div>

        {/* FORMULAIRE (Modale inline fluide) */}
        <div className={`transition-all duration-500 overflow-hidden ${showForm ? 'max-h-[2000px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
          <form onSubmit={handleSubmit} className={`p-5 sm:p-8 rounded-3xl border ${theme.card}`}>
            <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${theme.text}`}>
              <Store size={20} className="text-violet-500" /> 
              {editingId ? 'Modifier le stand' : 'Informations du stand'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-6">
              {/* Nom */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Nom du stand <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Type size={16} className={`absolute left-4 top-3.5 ${theme.sub}`} />
                  <input type="text" placeholder="Ex: Espace VIP Sponsor..." className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium transition-all ${theme.input}`} value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Type de stand</label>
                <div className="relative">
                  <Tag size={16} className={`absolute left-4 top-3.5 ${theme.sub}`} />
                  <select className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium appearance-none transition-all ${theme.input}`} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="corner">Corner (Angle)</option>
                  </select>
                </div>
              </div>

              {/* Prix */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Prix (FCFA) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <DollarSign size={16} className={`absolute left-4 top-3.5 ${theme.sub}`} />
                  <input type="number" placeholder="0" className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium transition-all ${theme.input}`} value={form.prix_location} onChange={e => setForm({...form, prix_location: e.target.value})} required />
                </div>
              </div>

              {/* Taille */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Taille (m²)</label>
                <div className="relative">
                  <Ruler size={16} className={`absolute left-4 top-3.5 ${theme.sub}`} />
                  <input type="number" placeholder="Ex: 9" className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium transition-all ${theme.input}`} value={form.taille_m2} onChange={e => setForm({...form, taille_m2: e.target.value})} />
                </div>
              </div>

              {/* Emplacement */}
              <div className="md:col-span-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Zone / Emplacement</label>
                <div className="relative">
                  <MapPin size={16} className={`absolute left-4 top-3.5 ${theme.sub}`} />
                  <input type="text" placeholder="Ex: Allée A, Face scène principale..." className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium transition-all ${theme.input}`} value={form.emplacement} onChange={e => setForm({...form, emplacement: e.target.value})} />
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Description détaillée</label>
                <textarea placeholder="Décrivez les équipements inclus, les avantages..." rows="3" className={`w-full p-4 rounded-xl border outline-none font-medium transition-all resize-none ${theme.input}`} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>

            {/* UPLOAD IMAGE PREMIUM */}
            <div className="mb-8">
              <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${theme.label}`}>Visuel / Croquis du stand</label>
              <div 
                onClick={() => fileRef.current.click()} 
                className={`relative flex flex-col items-center justify-center w-full h-40 sm:h-48 rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-all group ${dark ? 'border-white/10 hover:border-violet-500 bg-black/20' : 'border-slate-300 hover:border-violet-500 bg-slate-50'}`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Aperçu" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <span className="text-white text-xs font-bold uppercase tracking-widest bg-white/20 px-4 py-2 rounded-lg backdrop-blur-md">Modifier l'image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center p-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${dark ? 'bg-white/5 text-slate-400 group-hover:text-violet-400' : 'bg-white shadow-sm text-slate-400 group-hover:text-violet-500'}`}>
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${theme.text}`}>Cliquez pour ajouter une image</p>
                      <p className={`text-[10px] uppercase tracking-widest mt-1 ${theme.sub}`}>PNG, JPG (Max 5Mo)</p>
                    </div>
                  </div>
                )}
                <input type="file" ref={fileRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button type="button" onClick={resetForm} className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${dark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                Annuler
              </button>
              <button disabled={loading} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-3.5 rounded-xl flex justify-center items-center gap-2 font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_20px_-10px_rgba(34,197,94,0.5)] disabled:opacity-70">
                {loading ? <Loader2 size={18} className="animate-spin" /> : (editingId ? <Edit2 size={18} /> : <Plus size={18} />)}
                {loading ? 'Enregistrement...' : (editingId ? 'Enregistrer les modifications' : 'Publier ce stand')}
              </button>
            </div>
          </form>
        </div>

        {/* GRILLE DES STANDS */}
        {stands.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {stands.map(s => (
              <div key={s.id} className={`flex flex-col rounded-3xl border overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${theme.card}`}>
                <div className="relative h-48 bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden group">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.nom} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={40} className="text-slate-300 dark:text-slate-700" />
                  )}
                  
                  {/* Badge de Type */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                    {s.type}
                  </div>

                  {/* Overlay d'Actions (Modifier / Supprimer) */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <button 
                      onClick={() => handleEdit(s)} 
                      className="p-1.5 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-violet-500 transition-colors shadow-lg"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)} 
                      className="p-1.5 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-rose-500 transition-colors shadow-lg"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  <h3 className={`font-black text-lg mb-4 line-clamp-1 ${theme.text}`}>{s.nom}</h3>
                  
                  <div className="space-y-2.5 mb-6">
                    <p className={`flex items-center gap-2 text-xs font-medium ${theme.sub}`}>
                      <MapPin size={14} className="text-violet-500" /> {s.emplacement || 'Emplacement non défini'}
                    </p>
                    <p className={`flex items-center gap-2 text-xs font-medium ${theme.sub}`}>
                      <Ruler size={14} className="text-emerald-500" /> {s.taille_m2 ? `${s.taille_m2} m²` : 'Taille non définie'}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-end justify-between">
                    <div>
                      <p className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 ${theme.sub}`}>Tarif location</p>
                      <p className="text-xl font-black text-violet-600 dark:text-violet-400">
                        {s.prix_location?.toLocaleString('fr-FR')} <span className="text-sm font-bold">FCFA</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : selectedEvent && (
          <div className={`text-center py-20 rounded-3xl border border-dashed ${dark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-300 bg-slate-50'}`}>
            <Store size={48} className={`mx-auto mb-4 opacity-50 ${theme.sub}`} />
            <h3 className={`text-lg font-bold mb-2 ${theme.text}`}>Aucun stand</h3>
            <p className={`text-sm max-w-sm mx-auto ${theme.sub}`}>Vous n'avez pas encore configuré de stands ou d'espaces d'exposition pour cet événement.</p>
          </div>
        )}

      </div>
    </div>
  );
}