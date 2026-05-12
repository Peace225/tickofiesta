import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import {
  Handshake, Plus, Trash2, Edit, Power, Upload,
  Link as LinkIcon, Image as ImageIcon, GripVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Partenaires() {
  const { dark } = useSelector((s) => s.theme);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    nom: '',
    logo: '',
    lien: '',
    description: '',
    actif: true,
    ordre: 0
  });

  const theme = {
    card: dark? 'bg-[#0f0e1a]/80 backdrop-blur-xl border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/40',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-500',
    input: dark? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-gray-200 text-slate-900 placeholder:text-slate-400',
    hover: dark? 'hover:bg-white/5' : 'hover:bg-gray-50',
  };

  const loadPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
    .from('partenaires')
    .select('*')
    .order('ordre', { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement des partenaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde. Max 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Format invalide. Utilisez JPG, PNG ou WEBP');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `partenaires/${fileName}`;

      const { error: uploadError } = await supabase.storage
    .from('partenaires')
    .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
    .from('partenaires')
    .getPublicUrl(filePath);

      setFormData({...formData, logo: data.publicUrl });
      setImagePreview(data.publicUrl);
      toast.success('Logo uploadé');
    } catch (err) {
      console.error(err);
      toast.error('Erreur upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessingId('create');

    try {
      if (editingPartner) {
        const { error } = await supabase
     .from('partenaires')
     .update(formData)
     .eq('id', editingPartner.id);
        if (error) throw error;
        toast.success('Partenaire mis à jour');
      } else {
        const { error } = await supabase
     .from('partenaires')
     .insert([formData]);
        if (error) throw error;
        toast.success('Partenaire ajouté');
      }

      setShowModal(false);
      setEditingPartner(null);
      setImagePreview('');
      setFormData({
        nom: '',
        logo: '',
        lien: '',
        description: '',
        actif: true,
        ordre: 0
      });
      loadPartners();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleActive = async (partner) => {
    setProcessingId(partner.id);
    try {
      const { error } = await supabase
    .from('partenaires')
    .update({ actif:!partner.actif })
    .eq('id', partner.id);

      if (error) throw error;
      toast.success(partner.actif? 'Partenaire désactivé' : 'Partenaire activé');
      loadPartners();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce partenaire?')) return;

    setProcessingId(id);
    try {
      const { error } = await supabase
    .from('partenaires')
    .delete()
    .eq('id', id);

      if (error) throw error;
      toast.success('Partenaire supprimé');
      loadPartners();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setFormData({
      nom: partner.nom,
      logo: partner.logo,
      lien: partner.lien || '',
      description: partner.description || '',
      actif: partner.actif,
      ordre: partner.ordre || 0
    });
    setImagePreview(partner.logo);
    setShowModal(true);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/20 rounded-full px-4 py-1.5 mb-3">
              <Handshake size={14} className="text-[#00d4aa]" />
              <span className="text-[#00d4aa] text- font-black uppercase tracking-widest">
                Gestion Partenaires
              </span>
            </div>
            <h1 className={`text-3xl md:text-4xl font-black tracking-tighter ${theme.text}`}>
              Partenaires
            </h1>
            <p className={`text-sm mt-2 ${theme.sub}`}>
              {partners.length} partenaire{partners.length > 1? 's' : ''} au total
            </p>
          </div>

          <button
            onClick={() => {
              setEditingPartner(null);
              setImagePreview('');
              setFormData({
                nom: '',
                logo: '',
                lien: '',
                description: '',
                actif: true,
                ordre: partners.length
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6c47ff] text-white text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#6c47ff]/30"
          >
            <Plus size={18} />
            Nouveau Partenaire
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Total Partenaires', value: partners.length, icon: Handshake, color: '#6c47ff' },
            { label: 'Actifs', value: partners.filter(p => p.actif).length, icon: Power, color: '#00d4aa' },
          ].map((stat) => (
            <div key={stat.label} className={`p-5 rounded-2xl border ${theme.card}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={20} />
              </div>
              <p className={`text-2xl font-black tracking-tighter ${theme.text}`}>{stat.value}</p>
              <p className={`text- font-bold uppercase tracking-widest mt-1 ${theme.sub}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Liste */}
        {loading? (
          <div className="flex justify-center items-center py-32">
            <Spinner size="lg" />
          </div>
        ) : partners.length === 0? (
          <div className={`py-20 text-center rounded-2xl border-2 border-dashed ${dark? 'border-white/5' : 'border-gray-200'}`}>
            <Handshake size={48} className="mx-auto mb-4 opacity-20" />
            <p className={`text-lg font-black ${theme.text}`}>Aucun partenaire</p>
            <p className={`text-sm mt-2 ${theme.sub}`}>Ajoutez votre premier partenaire</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map(partner => (
              <div key={partner.id} className={`rounded-2xl border overflow-hidden ${theme.card}`}>
                {/* Logo */}
                <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center p-6">
                  {partner.logo? (
                    <img src={partner.logo} alt={partner.nom} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon size={48} className="text-gray-400" />
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text- font-black uppercase tracking-widest border ${
                      partner.actif
                   ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {partner.actif? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className={`text-lg font-black ${theme.text}`}>{partner.nom}</h3>
                    {partner.description && (
                      <p className={`text-sm mt-1 line-clamp-2 ${theme.sub}`}>{partner.description}</p>
                    )}
                  </div>

                  {partner.lien && (
                    <div className={`flex items-center gap-2 text-xs ${theme.sub}`}>
                      <LinkIcon size={14} />
                      <span className="truncate font-medium">{partner.lien}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleToggleActive(partner)}
                      disabled={processingId === partner.id}
                      className={`flex-1 px-4 py-2 rounded-xl text- font-black uppercase tracking-widest border transition-all disabled:opacity-50 ${
                        partner.actif
                     ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500 hover:text-white'
                      }`}
                    >
                      {processingId === partner.id? <Spinner size="sm" /> : (partner.actif? 'Désactiver' : 'Activer')}
                    </button>
                    <button
                      onClick={() => openEditModal(partner)}
                      className={`px-4 py-2 rounded-xl bg-white/5 text-[#6c47ff] text- font-black uppercase tracking-widest border border-[#6c47ff]/20 hover:bg-[#6c47ff] hover:text-white transition-all`}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(partner.id)}
                      disabled={processingId === partner.id}
                      className={`px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text- font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl border ${theme.card} max-h- overflow-y-auto`}>
            <div className="p-6 border-b border-white/5">
              <h2 className={`text-2xl font-black ${theme.text}`}>
                {editingPartner? 'Modifier le partenaire' : 'Nouveau partenaire'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`text-sm font-bold ${theme.text}`}>Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/50 ${theme.input}`}
                  placeholder="Ex: Orange CI"
                />
              </div>

              <div>
                <label className={`text-sm font-bold ${theme.text}`}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/50 ${theme.input}`}
                  placeholder="Description du partenaire"
                />
              </div>

              {/* Upload Logo + URL */}
              <div>
                <label className={`text-sm font-bold ${theme.text}`}>Logo *</label>

                {(imagePreview || formData.logo) && (
                  <div className="mt-2 mb-3 relative h-32 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center p-4">
                    <img src={imagePreview || formData.logo} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}

                <div className="flex gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold cursor-pointer transition-all ${theme.input} ${theme.hover}`}>
                    <Upload size={18} />
                    {uploading? 'Upload...' : 'Uploader un logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                <p className={`text-xs mt-2 text-center ${theme.sub}`}>OU</p>

                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => {
                    setFormData({...formData, logo: e.target.value});
                    setImagePreview(e.target.value);
                  }}
                  className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/50 ${theme.input}`}
                  placeholder="https://exemple.com/logo.png"
                />
              </div>

              <div>
                <label className={`text-sm font-bold ${theme.text}`}>Lien du site</label>
                <input
                  type="url"
                  value={formData.lien}
                  onChange={(e) => setFormData({...formData, lien: e.target.value})}
                  className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/50 ${theme.input}`}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-bold ${theme.text}`}>Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.ordre}
                    onChange={(e) => setFormData({...formData, ordre: parseInt(e.target.value) || 0})}
                    className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/50 ${theme.input}`}
                  />
                </div>

                <div>
                  <label className={`text-sm font-bold ${theme.text}`}>Statut</label>
                  <select
                    value={formData.actif}
                    onChange={(e) => setFormData({...formData, actif: e.target.value === 'true'})}
                    className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/50 appearance-none cursor-pointer ${theme.input}`}
                  >
                    <option value="true">Actif</option>
                    <option value="false">Inactif</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPartner(null);
                    setImagePreview('');
                  }}
                  className={`flex-1 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest border ${theme.input} ${theme.hover}`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processingId === 'create' || uploading}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#6c47ff] text-white text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#6c47ff]/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === 'create'? <Spinner size="sm" /> : (editingPartner? 'Mettre à jour' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}