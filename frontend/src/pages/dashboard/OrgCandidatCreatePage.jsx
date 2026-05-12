import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { 
  X, Save, ArrowLeft, ImagePlus, 
  Loader2, Users, UserPlus, CheckCircle2, ListFilter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgCandidatCreatePage() {
  const { voteId } = useParams(); 
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [voteInfo, setVoteInfo] = useState({ titre: '', count: 0 });
  const [recentCandidats, setRecentCandidats] = useState([]);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const initialForm = {
    nom: '',
    age: '',
    sexe: 'femme',
    taille: '',
    categorie: 'principal',
    categorie_autre: '',
  };

  const [form, setForm] = useState(initialForm);

  const CANDIDAT_CATEGORIES = [
    { value: 'principal', label: 'Candidat Principal' },
    { value: 'espoir', label: 'Espoir / Révélation' },
    { value: 'junior', label: 'Catégorie Junior' },
    { value: 'senior', label: 'Catégorie Senior' },
    { value: 'autre', label: 'Autre (À préciser)' },
  ];

  const fetchContext = useCallback(async () => {
    if (!voteId || voteId === 'undefined') return;

    try {
        const { data: voteData } = await supabase.from('votes').select('titre').eq('id', voteId).single();
        const { count } = await supabase.from('candidats').select('*', { count: 'exact', head: true }).eq('vote_id', voteId);
        
        const { data: recent } = await supabase
          .from('candidats')
          .select('id, nom, categorie')
          .eq('vote_id', voteId)
          .order('created_at', { ascending: false })
          .limit(3);

        setVoteInfo({ titre: voteData?.titre || 'Concours', count: count || 0 });
        if (recent) setRecentCandidats(recent);
    } catch (err) {
        console.error("Erreur fetchContext:", err);
    }
  }, [voteId]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const uploadImage = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `candidats/${voteId}/${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage.from('vote-images').upload(path, file);
    if (error) throw error;
    
    return supabase.storage.from('vote-images').getPublicUrl(path).data.publicUrl;
  };

  // ✅ LOGIQUE DE SAUVEGARDE ET REDIRECTION
  const handleSubmit = async (e, shouldExit = false) => {
    if (e) e.preventDefault();
    
    if (!voteId || voteId === 'undefined') return toast.error("ID du vote introuvable.");
    if (!user) return toast.error('Session expirée.');
    if (!form.nom.trim()) return toast.error('Le nom du participant est obligatoire.');

    setLoading(true);
    try {
      let imageUrl = null;
      if (photoFile) imageUrl = await uploadImage(photoFile);

      const finalCategorie = form.categorie === 'autre' ? form.categorie_autre : form.categorie;

      const { error } = await supabase.from('candidats').insert([{
        vote_id: voteId,
        nom: form.nom.trim(),
        age: form.age ? parseInt(form.age) : null,
        sexe: form.sexe,
        taille: form.taille.trim() || null,
        categorie: finalCategorie,
        image_url: imageUrl
      }]);

      if (error) throw error;

      toast.success(`${form.nom} ajouté !`);
      
      if (shouldExit) {
        // Redirection vers la page des votes
        navigate('/dashboard/votes');
      } else {
        // Reste sur la page pour ajouter un autre candidat
        resetForm();
        fetchContext();
      }
    } catch (error) {
      toast.error("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTION POUR QUITTER PROPREMENT
  const handleTerminer = () => {
    // Si l'utilisateur a commencé à écrire un nom, on le sauvegarde avant de partir
    if (form.nom.trim() !== '') {
      handleSubmit(null, true);
    } else {
      // Sinon on quitte juste la page pour retourner à la liste
      navigate('/dashboard/votes');
    }
  };

  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#080812]' : 'bg-[#f4f5f7]',
    card: dark ? 'bg-[#12121f]/60 border-white/10' : 'bg-white border-gray-200',
    input: dark ? 'bg-white/5 border-white/10 text-white focus:border-[#00d4aa]' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#00d4aa]',
    sub: dark ? 'text-white/40' : 'text-gray-500'
  }), [dark]);

  return (
    <div className={`min-h-screen pt-8 pb-20 ${theme.bg}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard/votes')} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-100'}`}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Inscrire un Participant</h1>
              <p className={`text-sm font-medium ${theme.sub}`}>Concours : <span className="text-[#00d4aa] font-bold">{voteInfo.titre}</span></p>
            </div>
          </div>
          <div className="text-right">
             <span className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Total inscrits</span>
             <div className="flex items-center justify-end gap-2">
               <Users size={18} className="text-[#6c47ff]" />
               <span className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{voteInfo.count}</span>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <form onSubmit={(e) => handleSubmit(e, false)} className={`rounded-3xl border backdrop-blur-xl p-6 md:p-8 shadow-2xl ${theme.card}`}>
              <div className="grid md:grid-cols-3 gap-8">
                
                {/* PHOTO */}
                <div className="flex flex-col items-center">
                  {!photoPreview ? (
                    <label className={`relative flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-3xl cursor-pointer transition-all ${dark ? 'border-white/10 bg-white/5 hover:border-[#00d4aa]/50' : 'border-gray-300 bg-gray-50 hover:border-[#00d4aa]/50'}`}>
                      <ImagePlus size={32} className="opacity-20 mb-2" />
                      <p className="text-[10px] font-black uppercase opacity-40">Photo</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  ) : (
                    <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border-2 border-[#00d4aa] group">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={resetForm} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X size={14} /></button>
                    </div>
                  )}
                </div>

                {/* INFOS */}
                <div className="md:col-span-2 space-y-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-60">Nom Complet *</label>
                    <input type="text" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} className={`w-full px-4 py-3 rounded-xl border outline-none font-bold ${theme.input}`} placeholder="Ex: Jean Marc" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-60">Catégorie</label>
                      <select value={form.categorie} onChange={(e) => setForm({...form, categorie: e.target.value})} className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`}>
                        {CANDIDAT_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                      </select>
                    </div>
                    {form.categorie === 'autre' && (
                      <div className="animate-fade-in">
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-60">Précisez</label>
                        <input type="text" value={form.categorie_autre} onChange={(e) => setForm({...form, categorie_autre: e.target.value})} className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Âge" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} />
                    <input type="text" placeholder="Taille" value={form.taille} onChange={(e) => setForm({...form, taille: e.target.value})} className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {['femme', 'homme'].map((s) => (
                      <button key={s} type="button" onClick={() => setForm({...form, sexe: s})} className={`py-3 rounded-xl border font-bold capitalize transition-all ${form.sexe === s ? 'bg-[#00d4aa] border-[#00d4aa] text-white' : `${theme.input} opacity-50`}`}>{s}</button>
                    ))}
                  </div>

                  {/* ✅ BOUTONS CLAIRS ET DISTINCTS */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-[#00d4aa] text-white shadow-lg shadow-[#00d4aa]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      Ajouter (et continuer)
                    </button>
                    
                    <button 
                      type="button" 
                      disabled={loading}
                      onClick={handleTerminer} 
                      className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${dark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Terminer & Quitter
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] px-2 ${theme.sub}`}>Derniers ajouts</h3>
            {recentCandidats.length === 0 ? (
              <div className={`p-6 rounded-3xl border border-dashed text-center opacity-40 ${theme.card}`}>
                <p className="text-[10px] font-bold">Aucun participant</p>
              </div>
            ) : (
              recentCandidats.map((c) => (
                <div key={c.id} className={`p-4 rounded-2xl border flex items-center gap-3 animate-fade-in ${theme.card}`}>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><CheckCircle2 size={16} /></div>
                  <div className="overflow-hidden">
                    <p className={`text-sm font-black truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{c.nom}</p>
                    <p className="text-[10px] font-bold uppercase opacity-50 truncate">{c.categorie}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}