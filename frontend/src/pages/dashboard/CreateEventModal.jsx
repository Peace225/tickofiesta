import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { X, Upload, Loader2, Calendar, MapPin, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';

// Petite fonction pour formater la date correctement pour l'input
const formatLocalDatetime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 16);
};

export default function CreateEventModal({ show, onClose, onSuccess, eventToEdit = null }) {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [form, setForm] = useState({
    titre: '',
    description: '',
    lieu: '',
    date: '',
    categorie: 'Concert',
    prix: 0,
    is_gratuit: false
  });

  // PRÉ-REMPLIR LE FORMULAIRE SI ON CLIQUE SUR "MODIFIER"
  useEffect(() => {
    if (eventToEdit) {
      setForm({
        titre: eventToEdit.titre || '',
        description: eventToEdit.description || '',
        lieu: eventToEdit.lieu || '',
        date: formatLocalDatetime(eventToEdit.date),
        categorie: eventToEdit.categorie || 'Concert',
        prix: eventToEdit.prix || 0,
        is_gratuit: eventToEdit.prix === 0
      });
      setPreviewUrl(eventToEdit.image || null);
    } else {
      setForm({
        titre: '', description: '', lieu: '', date: '', categorie: 'Concert', prix: 0, is_gratuit: false
      });
      setPreviewUrl(null);
    }
    setImageFile(null);
  }, [eventToEdit, show]);

  if (!show) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Si on modifie, on garde l'ancienne image par défaut. 
      // Si on crée, c'est null par défaut.
      let imageUrl = eventToEdit ? eventToEdit.image : null;

      // 1. Upload de la NOUVELLE image (si l'utilisateur en a choisi une)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('events').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      const finalPrix = form.is_gratuit ? 0 : Number(form.prix);

      // 2. Préparation des données STRICTES (pour éviter l'erreur 400 avec is_gratuit)
      const payload = {
        titre: form.titre,
        description: form.description,
        lieu: form.lieu,
        date: form.date,
        categorie: form.categorie,
        prix: finalPrix,
        image: imageUrl,
      };

      // 3. LOGIQUE : MISE À JOUR OU CRÉATION ?
      if (eventToEdit) {
        // --- MODE ÉDITION ---
        const { error: updateError } = await supabase
          .from('events')
          .update(payload)
          .eq('id', eventToEdit.id);

        if (updateError) throw updateError;
        toast.success('Événement mis à jour avec succès !');

      } else {
        // --- MODE CRÉATION ---
        const { error: insertError } = await supabase
          .from('events')
          .insert([{
            ...payload,
            organisateur_id: user.id,
            statut: 'en_attente',
            vote_actif: false
          }]);

        if (insertError) throw insertError;
        toast.success('Événement créé avec succès !');
      }

      onSuccess(); // Rafraîchit la liste des événements
      onClose();   // Ferme le modal
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full p-3 rounded-xl border outline-none transition-all focus:ring-2 ring-[#6c47ff]/20 ${
    dark ? 'bg-[#161527] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#080812]/90 backdrop-blur-sm">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border animate-scale-up custom-scrollbar ${
        dark ? 'bg-[#0f0e1a] border-white/10' : 'bg-white border-gray-100 shadow-2xl'
      }`}>
        
        {/* Header Modal */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-inherit backdrop-blur-md bg-inherit/80">
          <div>
            <h2 className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>
              {eventToEdit ? 'Modifier l\'événement' : 'Nouvel Événement'}
            </h2>
            <p className="text-xs font-bold text-[#6c47ff] uppercase tracking-widest">
              {eventToEdit ? 'Mise à jour des informations' : 'Configuration initiale'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Upload Image Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Image de couverture</label>
            <div 
              onClick={() => document.getElementById('event-img').click()}
              className={`relative h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#6c47ff]/50 overflow-hidden ${
                dark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#6c47ff]/10 flex items-center justify-center text-[#6c47ff] mb-2">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-bold opacity-60">Cliquez pour ajouter une affiche</span>
                </>
              )}
              <input id="event-img" type="file" hidden accept="image/*" onChange={handleImageChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Titre */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom de l'événement</label>
              <input required type="text" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} className={inputClass} placeholder="Ex: Festival des Grillades" />
            </div>

            {/* Catégories enrichies */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Catégorie</label>
              <select value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} className={inputClass}>
                <option value="Concert">Concert</option>
                <option value="Festival">Festival</option>
                <option value="Soirée">Soirée</option>
                <option value="Culture">Culture</option>
                <option value="Gastronomie">Gastronomie</option>
                <option value="Sport">Sport</option>
                <option value="Formation">Formation</option>
                <option value="Business">Business</option>
                <option value="Science">Science</option>
                <option value="Religieux">Religieux</option>
                <option value="Tourisme">Tourisme</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Description détaillée</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`${inputClass} resize-none`} placeholder="Parlez-nous de votre événement..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lieu */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Lieu / Ville</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c47ff]" />
                <input required type="text" value={form.lieu} onChange={e => setForm({...form, lieu: e.target.value})} className={`${inputClass} pl-10`} placeholder="Ex: Palais de la Culture" />
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Date et Heure</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c47ff]" />
                <input required type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={`${inputClass} pl-10`} />
              </div>
            </div>
          </div>

          {/* Pricing Section - Logique des billets */}
          <div className={`p-4 rounded-2xl border ${dark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-[#00d4aa]" />
                <span className="text-xs font-black uppercase">Tarification Principale</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={form.is_gratuit} 
                  onChange={e => setForm({...form, is_gratuit: e.target.checked})} 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d4aa]"></div>
                <span className="ml-3 text-[10px] font-black uppercase text-gray-500">Gratuit</span>
              </label>
            </div>

            {!form.is_gratuit ? (
              <div className="animate-fade-in">
                <input 
                  type="number" 
                  min="0"
                  value={form.prix} 
                  onChange={e => setForm({...form, prix: e.target.value})} 
                  className={inputClass} 
                  placeholder="Prix d'entrée de base (FCFA)" 
                />
                <p className="text-[9px] mt-2 font-bold text-amber-500 uppercase tracking-tighter">
                  * Ce prix sera affiché par défaut. Vous pourrez configurer des tarifs multiples (VIP, Pass...) plus tard dans le menu "Billetterie".
                </p>
              </div>
            ) : (
              <div className="animate-fade-in bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">L'accès à cet événement sera 100% gratuit.</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6c47ff] to-[#5a37e0] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-[#6c47ff]/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (eventToEdit ? 'Enregistrer les modifications' : 'Publier l\'événement')}
          </button>

        </form>
      </div>
    </div>
  );
}