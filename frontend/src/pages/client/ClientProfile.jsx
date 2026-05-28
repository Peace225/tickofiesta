import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { updateUser } from '../../store/slices/authSlice'; 
import toast from 'react-hot-toast';
import { Camera, Save, Ticket, Bell, Loader2, Megaphone, Palette, Eye } from 'lucide-react';

export default function ClientProfile() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || null);
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    telephone: user?.telephone || '',
  });
  
  const fileInputRef = useRef(null);

  const theme = {
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0A0A12] border-white/10' : 'bg-white border-slate-200',
    input: dark ? 'bg-[#161621] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      dispatch(updateUser({ avatar_url: data.publicUrl }));
      toast.success("Image mise à jour !");
    } catch (err) {
      toast.error("Erreur d'upload");
      setPreviewUrl(user?.avatar_url || null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await supabase.from('profiles').update({ nom: formData.nom, telephone: formData.telephone }).eq('id', user.id);
      dispatch(updateUser({ nom: formData.nom, telephone: formData.telephone }));
      toast.success("Profil mis à jour");
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-lg mx-auto lg:max-w-4xl">
      <div className="mb-6 md:mb-8">
        <h1 className={`text-2xl md:text-3xl font-black tracking-tighter ${theme.text}`}>Paramètres du compte</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* SECTION IDENTITÉ */}
        <div className={`p-6 md:p-8 rounded-[2rem] border ${theme.card}`}>
          <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden transition-all">
                {previewUrl ? <img src={previewUrl} alt="Profil" className="w-full h-full object-cover" /> : formData.nom.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-1 right-1 p-2 bg-black rounded-full text-white border-2 border-white dark:border-[#0A0A12]">
                <Camera size={14} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUploadImage} />
            <h2 className={`mt-4 text-sm font-bold ${theme.text}`}>{formData.nom || 'Utilisateur'}</h2>
          </div>

          <div className="space-y-4">
            <input value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className={`w-full p-3 rounded-xl border text-xs font-medium ${theme.input}`} placeholder="Nom complet" />
            <input value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} className={`w-full p-3 rounded-xl border text-xs font-medium ${theme.input}`} placeholder="Numéro de téléphone" />
            <button onClick={handleSaveProfile} className="w-full bg-[#6c47ff] text-white py-3 rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Enregistrer</>}
            </button>
          </div>
        </div>

        {/* NOUVELLE SECTION : MARKETING & UI/UX */}
        <div className={`p-6 md:p-8 rounded-[2rem] border ${theme.card}`}>
          <h3 className={`text-sm font-bold mb-6 ${theme.text}`}>Préférences & Expérience</h3>
          <div className="space-y-6">
            
            {/* Marketing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="text-[#6c47ff]" size={18} />
                <div>
                  <p className={`text-xs font-bold ${theme.text}`}>Offres exclusives</p>
                  <p className={`text-[9px] uppercase tracking-wider ${theme.sub}`}>Marketing & Newsletters</p>
                </div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>

            {/* UI/UX Design */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="text-[#00d4aa]" size={18} />
                <div>
                  <p className={`text-xs font-bold ${theme.text}`}>Interface UX</p>
                  <p className={`text-[9px] uppercase tracking-wider ${theme.sub}`}>Mode sombre & animations</p>
                </div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="text-orange-500" size={18} />
                <div>
                  <p className={`text-xs font-bold ${theme.text}`}>Vue compacte</p>
                  <p className={`text-[9px] uppercase tracking-wider ${theme.sub}`}>Densité de l'affichage</p>
                </div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}