import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { 
  Save, ArrowLeft, Calendar, Vote, Trophy, 
  BarChart2, Swords, ListOrdered, Sparkles, 
  FileText, UserPlus, Loader2, Upload, ImageIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgVoteCreatePage() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    titre: '',
    description: '',
    date_fin: '',
    type: 'concours', // Ce sera enregistré dans la colonne "categorie"
  });

  const VOTE_MECHANICS = [
    { 
      id: 'concours', 
      label: 'Concours de Beauté / Awards', 
      desc: 'Pour élire une personne (Miss, Mister, Awards, Élections).',
      icon: <Trophy size={18} className="text-yellow-500" />
    },
    { 
      id: 'sondage', 
      label: 'Sondage d\'opinion', 
      desc: 'Pour recueillir des avis ou réaliser une étude de marché.',
      icon: <BarChart2 size={18} className="text-blue-500" />
    },
    { 
      id: 'battle', 
      label: 'Battle / Compétition', 
      desc: 'Format 1v1 ou rounds (Battle de rap, danse, talent).',
      icon: <Swords size={18} className="text-red-500" />
    },
    { 
      id: 'classement', 
      label: 'Classement / Top', 
      desc: 'Pour faire un top avec élimination ou classement par rang.',
      icon: <ListOrdered size={18} className="text-purple-500" />
    },
    { 
      id: 'prediction', 
      label: 'Prédiction / Pari', 
      desc: 'Voter sur un résultat futur (Sport, Événements).',
      icon: <Sparkles size={18} className="text-emerald-500" />
    }
  ];

  // 📸 Gestion de l'aperçu de l'image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error("L'image est trop lourde (max 5Mo)");
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e, redirectPath = 'list') => {
    e.preventDefault();
    if (!user) return toast.error("Vous devez être connecté");
    if (!form.titre || !form.date_fin) return toast.error("Titre et Date obligatoires");
    if (!imageFile) return toast.error("Veuillez ajouter une affiche pour le concours");
    
    setLoading(true);
    try {
      // 1. Upload de l'image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `covers/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vote-images') // ✅ Bucket corrigé
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vote-images')
        .getPublicUrl(filePath);

      // 2. Enregistrement dans la base de données
      const payload = {
        organisateur_id: user.id,
        titre: form.titre.trim(),
        description: form.description.trim(),
        date_fin: new Date(form.date_fin).toISOString(),
        categorie: form.type, // ✅ Mappé sur la bonne colonne SQL
        image_url: publicUrl,
        statut: 'en_attente' // En attente de validation admin
      };

      const { data, error } = await supabase
        .from('votes')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast.success("Événement créé avec succès !");
      
      // Redirection intelligente
      if (redirectPath === 'candidats') {
        navigate(`/dashboard/votes/${data.id}/candidats/create`);
      } else {
        navigate('/dashboard/votes');
      }

    } catch (error) {
      console.error("Erreur insertion:", error);
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#080812]' : 'bg-[#f4f5f7]',
    card: dark ? 'bg-[#12121f] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl',
    input: dark ? 'bg-white/5 border-white/10 text-white focus:border-[#6c47ff]' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#6c47ff]',
    text: dark ? 'text-white' : 'text-gray-900',
    sub: dark ? 'text-white/50' : 'text-gray-500'
  }), [dark]);

  return (
    <div className={`min-h-screen pt-8 pb-20 transition-colors duration-300 ${theme.bg}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <button onClick={() => navigate(-1)} className={`mb-8 flex items-center gap-2 font-bold uppercase tracking-widest text-[10px] transition-all hover:translate-x-[-4px] ${theme.sub}`}>
          <ArrowLeft size={14} /> Retour
        </button>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#6c47ff]/20">
            <Vote size={40} className="text-white" />
          </div>
          <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${theme.text}`}>Nouveau Concours</h1>
        </div>

        <form className={`rounded-[2.5rem] border p-8 md:p-12 ${theme.card}`}>
          <div className="space-y-8">
            
            {/* 📸 IMAGE UPLOAD AVEC APERÇU */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme.sub}`}>
                Affiche / Couverture *
              </label>
              <div className={`relative flex items-center justify-center w-full h-56 md:h-72 rounded-[2rem] border-2 border-dashed transition-all overflow-hidden ${dark ? 'border-white/10 bg-black/20 hover:border-[#6c47ff]/50' : 'border-gray-300 bg-gray-50 hover:border-[#6c47ff]/50'}`}>
                {imagePreview ? (
                  <div className="relative w-full h-full group">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
                        Changer l'affiche
                      </span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#6c47ff]/10 flex items-center justify-center text-[#6c47ff] mb-2">
                      <Upload size={24} />
                    </div>
                    <span className={`text-[12px] font-black uppercase tracking-widest ${theme.text}`}>Ajouter une image</span>
                    <span className={`text-[10px] font-medium ${theme.sub}`}>Format recommandé : 16:9 (Max 5Mo)</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>

            {/* TITRE */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme.sub}`}>Nom du concours *</label>
              <input type="text" required value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold text-lg transition-all ${theme.input}`} placeholder="Ex: Miss Côte d'Ivoire 2026" />
            </div>

            {/* TYPE DE VOTE */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme.sub}`}>Type de vote *</label>
              <div className="grid grid-cols-1 gap-4">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold appearance-none cursor-pointer ${theme.input}`}>
                  {VOTE_MECHANICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <div className={`p-5 rounded-2xl border flex items-start gap-4 ${dark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="mt-1">{VOTE_MECHANICS.find(m => m.id === form.type)?.icon}</div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-wider mb-1 ${theme.text}`}>{VOTE_MECHANICS.find(m => m.id === form.type)?.label}</p>
                    <p className={`text-xs leading-relaxed font-medium ${theme.sub}`}>{VOTE_MECHANICS.find(m => m.id === form.type)?.desc}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme.sub}`}>Description</label>
              <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`w-full px-6 py-4 rounded-2xl border outline-none font-medium resize-none ${theme.input}`} placeholder="Règles, prix à gagner..." />
            </div>

            {/* DATE */}
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme.sub}`}>Date de clôture *</label>
              <input type="datetime-local" required value={form.date_fin} onChange={e => setForm({...form, date_fin: e.target.value})} className={`w-full px-6 py-4 rounded-2xl border outline-none font-bold ${theme.input} [color-scheme:dark]`} />
            </div>

            {/* BOUTONS D'ACTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button 
                type="button"
                disabled={loading}
                onClick={(e) => handleSubmit(e, 'list')}
                className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${dark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer le vote
              </button>

              <button 
                type="button"
                disabled={loading}
                onClick={(e) => handleSubmit(e, 'candidats')}
                className="py-5 rounded-2xl bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Ajouter des participants
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}