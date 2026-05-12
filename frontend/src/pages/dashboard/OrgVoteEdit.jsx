import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { 
  ArrowLeft, Save, Upload, Calendar, FileText, 
  Type, ListFilter, ImageIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function OrgVoteEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    image_url: '',
    date_fin: '',
    categorie: 'autre',
    categorie_autre: '',
  });

  const CATEGORIES = useMemo(() => [
    { value: 'beaute', label: 'Concours de Beauté (Miss/Mister)' },
    { value: 'musique', label: 'Talent Musical / Chant' },
    { value: 'sport', label: 'Élection Sportive' },
    { value: 'awards', label: 'Cérémonie d\'Awards' },
    { value: 'autre', label: 'Autre (Préciser)' },
  ], []);

  const fetchVoteDetails = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('id', id)
        .eq('organisateur_id', user.id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error("Vote introuvable");
        navigate('/dashboard/votes');
        return;
      }

      const isKnownCategory = CATEGORIES.some(c => c.value === data.categorie);
      
      // Conversion de la date pour l'input datetime-local
      const dateFormatee = data.date_fin ? new Date(data.date_fin).toISOString().slice(0, 16) : '';

      setFormData({
        titre: data.titre || '',
        description: data.description || '',
        image_url: data.image_url || '',
        date_fin: dateFormatee,
        categorie: isKnownCategory ? (data.categorie || 'autre') : 'autre',
        categorie_autre: isKnownCategory ? '' : (data.categorie || ''),
      });

    } catch (error) {
      console.error("Erreur details:", error.message);
      toast.error("Erreur de chargement");
      navigate('/dashboard/votes');
    } finally {
      setLoading(false);
    }
  }, [id, user, navigate, CATEGORIES]);

  useEffect(() => {
    fetchVoteDetails();
  }, [fetchVoteDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // =========================================================
  // 🛠️ GESTION DE L'IMAGE (CORRIGÉE : Bucket 'vote-images')
  // =========================================================
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return toast.error("L'image est trop lourde (max 5Mo)");

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `covers/${user.id}/${fileName}`;

      // ✅ CORRECTION DU NOM DU BUCKET : 'vote-images' (SANS S)
      const { error: uploadError } = await supabase.storage
        .from('vote-images') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vote-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Image mise à jour");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Échec de l'envoi de l'image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre || !formData.date_fin) return toast.error("Complétez les champs obligatoires");

    setSaving(true);
    try {
      const finalCategorie = formData.categorie === 'autre' ? formData.categorie_autre : formData.categorie;

      const { error } = await supabase
        .from('votes')
        .update({
          titre: formData.titre,
          description: formData.description,
          image_url: formData.image_url,
          date_fin: new Date(formData.date_fin).toISOString(),
          categorie: finalCategorie,
        })
        .eq('id', id)
        .eq('organisateur_id', user.id);

      if (error) throw error;

      toast.success('Concours mis à jour !');
      navigate('/dashboard/votes'); 
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    card: dark ? 'bg-[#12121f] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-white/5 border-white/10 text-white focus:border-[#6c47ff]' : 'bg-slate-50 border-gray-200 text-gray-900 focus:border-[#6c47ff]',
  }), [dark]);

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}><Spinner size="xl" /></div>;

  return (
    <div className={`min-h-screen pt-8 pb-20 transition-colors duration-300 ${theme.bg}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-5 mb-8">
          <button 
            onClick={() => navigate('/dashboard/votes')} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-gray-200 text-slate-600 hover:shadow-md'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${theme.text}`}>Paramètres du Vote</h1>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${theme.sub}`}>Gestion du concours</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`rounded-[2.5rem] border p-6 md:p-10 ${theme.card}`}>
          <div className="space-y-8">
            
            {/* TITRE */}
            <div>
              <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 ${theme.text}`}>
                <Type size={14} className="text-[#6c47ff]" /> Nom du Concours
              </label>
              <input type="text" name="titre" value={formData.titre} onChange={handleChange} required className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold transition-all ${theme.input}`} />
            </div>

            {/* CATEGORIE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 ${theme.text}`}>
                  <ListFilter size={14} className="text-[#00d4aa]" /> Catégorie
                </label>
                <select name="categorie" value={formData.categorie} onChange={handleChange} className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold appearance-none cursor-pointer ${theme.input}`}>
                  {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>

              {formData.categorie === 'autre' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest mb-3 ${theme.text}`}>Précisez le type</label>
                  <input type="text" name="categorie_autre" value={formData.categorie_autre} onChange={handleChange} required placeholder="Ex: Photographie..." className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold ${theme.input}`} />
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 ${theme.text}`}>
                <FileText size={14} className="text-indigo-500" /> Description & Règles
              </label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold resize-none ${theme.input}`}></textarea>
            </div>

            {/* IMAGE (UPLOAD CORRIGÉ) */}
            <div>
              <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 ${theme.text}`}>
                <Upload size={14} className="text-[#f5a623]" /> Affiche de couverture
              </label>
              <div className={`relative flex items-center justify-center w-full h-56 rounded-[2rem] border-2 border-dashed transition-all overflow-hidden ${dark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                {uploadingImage ? (
                  <Spinner size="md" />
                ) : formData.image_url ? (
                  <div className="relative w-full h-full group">
                    <img src={formData.image_url} alt="Affiche" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">Changer l'affiche</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center p-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#f5a623]/10 flex items-center justify-center text-[#f5a623]"><ImageIcon size={24} /></div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${theme.sub}`}>Cliquez pour ajouter l'affiche</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>

            {/* DATE FIN */}
            <div>
              <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-3 ${theme.text}`}>
                <Calendar size={14} className="text-rose-500" /> Fin des votes
              </label>
              <input type="datetime-local" name="date_fin" value={formData.date_fin} onChange={handleChange} required className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold ${theme.input} [color-scheme:dark]`} />
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-4">
            <button type="button" onClick={() => navigate('/dashboard/votes')} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${dark ? 'text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}>Annuler</button>
            <button type="submit" disabled={saving || uploadingImage} className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] shadow-[0_15px_40px_-5px_rgba(108,71,255,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all">
              {saving ? <Spinner size="sm" color="white" /> : <Save size={16} />}
              {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}