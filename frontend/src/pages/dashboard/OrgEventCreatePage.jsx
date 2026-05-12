import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { 
  Calendar, MapPin, ImageIcon, 
  Plus, Trash2, Save, Sparkles, Tag 
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../../components/shared/BackButton';

export default function OrgEventCreatePage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date: '',
    heure: '',
    lieu: '',
    categorie_id: '',
  });

  const [tarifs, setTarifs] = useState([
    { type: 'Standard', prix: 0, quantite_disponible: 100 }
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*').eq('is_active', true);
      if (error) console.error("Erreur catégories:", error);
      else setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("L'image est trop lourde (max 2Mo)");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addTarif = () => setTarifs([...tarifs, { type: '', prix: 0, quantite_disponible: 0 }]);
  const removeTarif = (index) => setTarifs(tarifs.filter((_, i) => i !== index));

  const updateTarif = (index, field, value) => {
    const newTarifs = [...tarifs];
    // Sécurité pour les nombres : évite le NaN si le champ est vide
    const val = (field === 'prix' || field === 'quantite_disponible') ? (parseInt(value) || 0) : value;
    newTarifs[index][field] = val;
    setTarifs(newTarifs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = user?.id || user?.user?.id; // Sécurité sur l'ID
    
    if (!userId) return toast.error("Session expirée, reconnectez-vous");
    if (!imageFile) return toast.error("L'affiche de l'événement est obligatoire");

    setLoading(true);
    try {
      // 1. Upload de l'image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. Création de l'événement
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([{
          ...formData,
          organisateur_id: userId,
          image_url: filePath,
          statut: 'en_attente'
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // 3. Création des tarifs
      const tarifsToInsert = tarifs.map(t => ({
        ...t,
        event_id: eventData.id
      }));

      const { error: tarifsError } = await supabase.from('tarifs').insert(tarifsToInsert);
      if (tarifsError) throw tarifsError;

      toast.success("Événement envoyé pour validation !");
      navigate('/dashboard/events');

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    card: dark ? 'bg-[#0f0e1a] border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-white/5 border-white/10 text-white focus:border-[#6c47ff]' : 'bg-gray-50 border-gray-200 text-slate-900 focus:border-[#6c47ff]'
  };

  return (
    <div className={`min-h-screen ${theme.bg} p-4 md:p-10 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
          <div>
            <BackButton label="Retour" />
            <h1 className={`text-3xl font-black mt-4 tracking-tighter ${theme.text}`}>NOUVEL ÉVÉNEMENT</h1>
          </div>
          <div className="hidden md:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] items-center justify-center shadow-xl">
            <Sparkles className="text-white" size={20} />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* IMAGE UPLOAD */}
          <div className={`rounded-[2.5rem] p-8 ${theme.card}`}>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${theme.sub}`}>
              <ImageIcon size={14} /> Affiche (16:9)
            </h2>
            <div className="relative group h-72 rounded-[2rem] overflow-hidden border-2 border-dashed border-white/10 hover:border-[#6c47ff]/50 transition-all bg-black/20">
              {imagePreview ? (
                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-10">
                  <ImageIcon size={48} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Cliquez ou glissez l'affiche ici</p>
                </div>
              )}
              <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            </div>
          </div>

          {/* FORMULAIRE PRINCIPAL */}
          <div className={`rounded-[2.5rem] p-8 ${theme.card} grid grid-cols-1 md:grid-cols-2 gap-6`}>
            <div className="md:col-span-2">
               <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-50">Nom de l'événement</label>
               <input required type="text" placeholder="Ex: Festival Abidjan Mix" className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${theme.input}`}
                value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
            </div>

            <div>
               <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-50">Catégorie</label>
               <select required className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme.input}`}
                value={formData.categorie_id} onChange={e => setFormData({...formData, categorie_id: e.target.value})}>
                 <option value="">Sélectionner</option>
                 {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
               </select>
            </div>

            <div>
               <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-50">Lieu</label>
               <input required type="text" placeholder="Ex: Sofitel Hôtel Ivoire" className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme.input}`}
                value={formData.lieu} onChange={e => setFormData({...formData, lieu: e.target.value})} />
            </div>

            <div>
               <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-50">Date</label>
               <input required type="date" className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme.input}`}
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>

            <div>
               <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-50">Heure de début</label>
               <input required type="time" className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme.input}`}
                value={formData.heure} onChange={e => setFormData({...formData, heure: e.target.value})} />
            </div>

            <div className="md:col-span-2">
               <label className="text-[10px] font-black uppercase tracking-widest mb-2 block opacity-50">Description détaillée</label>
               <textarea rows={4} placeholder="Décrivez l'expérience..." className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme.input}`}
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          {/* TARIFS DYNAMIQUES */}
          <div className={`rounded-[2.5rem] p-8 ${theme.card}`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${theme.sub}`}>
                <Tag size={14} /> Billetterie
              </h2>
              <button type="button" onClick={addTarif} className="text-[#00d4aa] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#00d4aa]/10 px-4 py-2 rounded-full transition-all">
                <Plus size={14} /> Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {tarifs.map((tarif, index) => (
                <div key={index} className={`flex flex-col md:flex-row gap-4 p-5 rounded-3xl border animate-in fade-in slide-in-from-right-2 ${dark ? 'border-white/5 bg-white/5' : 'bg-slate-50 border-gray-100'}`}>
                  <input required placeholder="Nom du Pass" className={`flex-1 p-3 rounded-xl border outline-none text-xs font-black ${theme.input}`}
                    value={tarif.type} onChange={e => updateTarif(index, 'type', e.target.value)} />
                  
                  <div className="flex gap-4">
                    <input required type="number" placeholder="Prix (FCFA)" className={`w-full md:w-32 p-3 rounded-xl border outline-none text-xs font-black ${theme.input}`}
                      value={tarif.prix} onChange={e => updateTarif(index, 'prix', e.target.value)} />

                    <input required type="number" placeholder="Nb." className={`w-full md:w-24 p-3 rounded-xl border outline-none text-xs font-black ${theme.input}`}
                      value={tarif.quantite_disponible} onChange={e => updateTarif(index, 'quantite_disponible', e.target.value)} />
                  </div>

                  {tarifs.length > 1 && (
                    <button type="button" onClick={() => removeTarif(index)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6c47ff] via-[#8b6bff] to-[#00d4aa] text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(108,71,255,0.3)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Lancer l'événement</>}
          </button>

        </form>
      </div>
    </div>
  );
}