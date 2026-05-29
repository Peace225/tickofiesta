import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { 
  ArrowLeft, Save, Upload, Calendar, FileText, 
  Type, ListFilter, ImageIcon, Sparkles, Settings2 
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
  
  // État local (en français)
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
        .eq('organizer_id', user.id) // ✅ Basé sur l'image b_9.PNG
        .single();

      if (error) throw error;
      if (!data) {
        toast.error("Vote introuvable");
        navigate('/dashboard/votes');
        return;
      }

      // ✅ Lecture des colonnes en fonction de b_9.PNG (category, title)
      const isKnownCategory = CATEGORIES.some(c => c.value === data.category);
      const dateFormatee = data.date_fin ? new Date(data.date_fin).toISOString().slice(0, 16) : '';

      setFormData({
        titre: data.title || '', // Map de "title" (BDD) vers "titre" (React)
        description: data.description || '',
        image_url: data.image_url || '',
        date_fin: dateFormatee,
        categorie: isKnownCategory ? (data.category || 'autre') : 'autre', // Map de "category"
        categorie_autre: isKnownCategory ? '' : (data.category || ''),
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return toast.error("L'image est trop lourde (max 5Mo)");

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `covers/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vote-images') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vote-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Image mise à jour avec succès");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Échec de l'envoi de l'image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre || !formData.date_fin) return toast.error("Veuillez compléter les champs obligatoires");

    setSaving(true);
    try {
      const finalCategorie = formData.categorie === 'autre' ? formData.categorie_autre : formData.categorie;

      const { error } = await supabase
        .from('votes')
        .update({
          title: formData.titre, // ✅ Écriture vers "title" (BDD)
          description: formData.description,
          image_url: formData.image_url,
          date_fin: new Date(formData.date_fin).toISOString(),
          category: finalCategorie, // ✅ Écriture vers "category" (BDD)
        })
        .eq('id', id)
        .eq('organizer_id', user.id); // ✅ Filtre avec "organizer_id" (BDD)

      if (error) {
        console.error("❌ ERREUR SUPABASE:", error);
        throw error;
      }

      toast.success('Modifications enregistrées !');
      navigate('/dashboard/votes'); 
    } catch (error) {
      toast.error(`Erreur de sauvegarde : ${error.message || "inconnue"}`);
    } finally {
      setSaving(false);
    }
  };

  // 💎 THÈME ULTRA PREMIUM 
  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#030305]' : 'bg-[#f4f5f7]',
    card: dark ? 'bg-white/[0.02] border-white/5 backdrop-blur-2xl shadow-2xl shadow-black/50' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50',
    section: dark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark 
      ? 'bg-black/40 border-white/10 text-white focus:border-[#6c47ff] focus:ring-1 focus:ring-[#6c47ff] focus:bg-black/60' 
      : 'bg-white border-slate-300 text-slate-900 focus:border-[#6c47ff] focus:ring-1 focus:ring-[#6c47ff] focus:bg-slate-50 shadow-sm',
    label: dark ? 'text-slate-300' : 'text-slate-700',
  }), [dark]);

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}><Spinner size="xl" /></div>;

  return (
    <div className={`min-h-screen pt-8 pb-24 transition-colors duration-500 ${theme.bg} relative overflow-hidden`}>
      
      {/* 🌟 Background Glow subtil en mode dark */}
      {dark && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#6c47ff]/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* HEADER */}
        <div className="flex items-center gap-6 mb-10">
          <button 
            onClick={() => navigate('/dashboard/votes')} 
            className={`group w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 hover:-translate-x-1 ${dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:shadow-lg'}`}
          >
            <ArrowLeft size={20} className="group-hover:text-[#6c47ff] transition-colors" />
          </button>
          <div>
            <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${theme.text}`}>Paramètres de l'Événement</h1>
            <p className={`text-[11px] font-bold uppercase tracking-[0.2em] mt-1 text-[#6c47ff]`}>Mode Édition</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1 : VISUEL (Mise en avant du côté événementiel) */}
          <div className={`rounded-3xl border p-6 md:p-8 transition-all ${theme.card}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#f5a623]/10 flex items-center justify-center text-[#f5a623]">
                <ImageIcon size={16} />
              </div>
              <h2 className={`text-lg font-bold ${theme.text}`}>Affiche Officielle</h2>
            </div>

            <div className={`relative flex items-center justify-center w-full h-64 md:h-80 rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden group ${dark ? 'border-white/10 bg-black/40 hover:border-[#f5a623]/50' : 'border-slate-300 bg-slate-50 hover:border-[#f5a623]/50'}`}>
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-3">
                  <Spinner size="lg" color="#f5a623" />
                  <span className={`text-xs font-bold uppercase tracking-widest ${theme.sub}`}>Traitement de l'image...</span>
                </div>
              ) : formData.image_url ? (
                <div className="relative w-full h-full">
                  <img src={formData.image_url} alt="Affiche" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 flex flex-col items-center justify-end pb-8 transition-all duration-300">
                    <span className="text-white text-[11px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 shadow-2xl flex items-center gap-2">
                      <Upload size={14} /> Modifier l'affiche
                    </span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6">
                  <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center text-slate-300 transition-transform duration-300 group-hover:scale-110 group-hover:text-[#f5a623]">
                    <Upload size={28} />
                  </div>
                  <div>
                    <p className={`font-bold ${theme.text}`}>Glissez ou cliquez pour uploader</p>
                    <p className={`text-[11px] uppercase tracking-widest mt-1 ${theme.sub}`}>Format recommandé : 1080x1080px (Max 5Mo)</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2 : INFORMATIONS PRINCIPALES */}
          <div className={`rounded-3xl border p-6 md:p-8 transition-all ${theme.card}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center text-[#00d4aa]">
                <Sparkles size={16} />
              </div>
              <h2 className={`text-lg font-bold ${theme.text}`}>Détails de la Compétition</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-2.5 ${theme.label}`}>
                  Titre du Concours <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Type size={16} className={`absolute left-5 transition-colors ${theme.sub}`} />
                  <input type="text" name="titre" value={formData.titre} onChange={handleChange} required placeholder="Ex: Miss Côte d'Ivoire 2026..." className={`w-full pl-12 pr-5 py-4 rounded-2xl outline-none font-semibold transition-all duration-300 ${theme.input}`} />
                </div>
              </div>

              <div>
                <label className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-2.5 ${theme.label}`}>
                  Catégorie
                </label>
                <div className="relative flex items-center">
                  <ListFilter size={16} className={`absolute left-5 transition-colors ${theme.sub}`} />
                  <select name="categorie" value={formData.categorie} onChange={handleChange} className={`w-full pl-12 pr-5 py-4 rounded-2xl outline-none font-semibold appearance-none cursor-pointer transition-all duration-300 ${theme.input}`}>
                    {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>
              </div>

              {formData.categorie === 'autre' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <label className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-2.5 ${theme.label}`}>Précisez</label>
                  <input type="text" name="categorie_autre" value={formData.categorie_autre} onChange={handleChange} required placeholder="Type d'événement..." className={`w-full px-5 py-4 rounded-2xl outline-none font-semibold transition-all duration-300 ${theme.input}`} />
                </div>
              ) : (
                <div className="hidden md:block"></div>
              )}

              <div className="md:col-span-2">
                <label className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-2.5 ${theme.label}`}>
                  Description & Règles
                </label>
                <div className="relative">
                  <FileText size={16} className={`absolute left-5 top-5 transition-colors ${theme.sub}`} />
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Décrivez les règles, les récompenses, le concept..." className={`w-full pl-12 pr-5 py-4 rounded-2xl outline-none font-semibold resize-none transition-all duration-300 ${theme.input}`}></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 : PARAMÈTRES AVANCÉS */}
          <div className={`rounded-3xl border p-6 md:p-8 transition-all ${theme.card}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Settings2 size={16} />
              </div>
              <h2 className={`text-lg font-bold ${theme.text}`}>Configuration du Vote</h2>
            </div>

            <div className={`p-5 md:p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${theme.section}`}>
              <div>
                <h3 className={`font-bold text-sm ${theme.text}`}>Clôture des votes</h3>
                <p className={`text-xs mt-1 max-w-sm ${theme.sub}`}>Définissez la date et l'heure exactes auxquelles les votes seront automatiquement fermés pour le public.</p>
              </div>
              <div className="w-full md:w-64 shrink-0">
                <div className="relative flex items-center">
                  <Calendar size={16} className={`absolute left-4 transition-colors ${theme.sub} pointer-events-none z-10`} />
                  <input 
                    type="datetime-local" 
                    name="date_fin" 
                    value={formData.date_fin} 
                    onChange={handleChange} 
                    required 
                    style={{ colorScheme: dark ? 'dark' : 'light' }}
                    className={`w-full pl-10 pr-4 py-3.5 rounded-xl outline-none font-bold text-sm transition-all duration-300 ${theme.input}`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard/votes')} 
              className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${dark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={saving || uploadingImage} 
              className="group relative flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white overflow-hidden shadow-[0_15px_40px_-5px_rgba(108,71,255,0.5)] hover:shadow-[0_20px_50px_-5px_rgba(108,71,255,0.7)] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#6c47ff] via-[#8b6bff] to-[#00d4aa] transition-transform duration-500 group-hover:scale-110" />
              <div className="relative flex items-center justify-center gap-2">
                {saving ? <Spinner size="sm" color="white" /> : <Save size={16} />}
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </div>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}