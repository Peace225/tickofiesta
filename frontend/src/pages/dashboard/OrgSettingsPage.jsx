import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import { 
  User, Mail, Save, Phone, Camera, Sparkles, 
  Shield, CreditCard, Loader2, FileText, CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgSettingsPage() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // ✅ INITIALISATION PROPRE (évite les avertissements "uncontrolled input")
  const [form, setForm] = useState({
    nom: '',
    phone: '',
    avatar_url: '',
    bio: '',
    is_verified: false,
    accepted_privacy_policy: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('nom, phone, avatar_url, bio, is_verified, accepted_privacy_policy')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        // ✅ PROTECTION CONTRE LES VALEURS NULL (Source des erreurs logs)
        setForm({
          nom: data.nom || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || '',
          is_verified: data.is_verified || false,
          accepted_privacy_policy: data.accepted_privacy_policy || false
        });
      }
    };
    fetchProfile();
  }, [user]);

  // ✅ LOGIQUE UPLOAD AVATAR RESTAURÉE
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image trop lourde (Max 2Mo)');

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Photo mise à jour !');
    } catch (err) {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!form.accepted_privacy_policy) {
      return toast.error("Vous devez accepter le contrat de confidentialité.");
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          nom: form.nom, 
          phone: form.phone,
          avatar_url: form.avatar_url,
          bio: form.bio,
          accepted_privacy_policy: true,
          date_acceptance: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profil mis à jour avec succès');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#080812]' : 'bg-[#f4f5f7]',
    card: dark ? 'bg-[#0f0e1a]/80 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#161527] border-white/10 text-white focus:border-[#6c47ff]' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#6c47ff]',
  }), [dark]);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${theme.bg}`}>
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth custom-scrollbar">
        <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-6 pb-32 relative z-10">
          
          {/* Header */}
          <div className="animate-fade-in">
            <h1 className={`text-3xl md:text-5xl font-black tracking-tighter mb-2 ${theme.text}`}>
              Mon <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">Profil</span>
            </h1>
            <p className={`text-xs md:text-sm font-medium ${theme.sub}`}>Vérification du compte et informations légales</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Colonne gauche : Preview Profil */}
            <div className="lg:col-span-1">
              <div className={`rounded-[2rem] border p-6 md:p-8 sticky top-6 text-center ${theme.card}`}>
                <div className="relative inline-block mb-6">
                   <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] p-1 shadow-2xl">
                    <div className="w-full h-full rounded-[1.4rem] overflow-hidden bg-[#161527] flex items-center justify-center relative">
                      {form.avatar_url ? (
                        <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={40} className="text-gray-600" />
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="animate-spin text-white" size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#6c47ff] text-white rounded-xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <Camera size={18} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>

                <div className="space-y-4">
                  <p className={`text-lg md:text-xl font-black truncate px-2 ${theme.text}`}>{form.nom || 'Organisateur'}</p>
                  
                  {/* BADGE DE VÉRIFICATION */}
                  {form.is_verified ? (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle size={12} /> Partenaire Vérifié
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Shield size={12} /> En attente de badge
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne droite : Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              <div className={`rounded-[2rem] border overflow-hidden ${theme.card}`}>
                <form onSubmit={handleSave} className="p-6 md:p-10 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${theme.text}`}>Nom de l'organisation</label>
                      <input 
                        type="text" 
                        value={form.nom || ''} 
                        onChange={e => setForm({...form, nom: e.target.value})} 
                        className={`w-full p-4 rounded-xl border outline-none text-sm font-bold ${theme.input}`} 
                        placeholder="Ex: Event Pro CI"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${theme.text}`}>Numéro Mobile Money</label>
                      <input 
                        type="tel" 
                        value={form.phone || ''} 
                        onChange={e => setForm({...form, phone: e.target.value})} 
                        className={`w-full p-4 rounded-xl border outline-none text-sm font-bold ${theme.input}`} 
                        placeholder="Ex: 0700000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${theme.text}`}>Biographie / Description</label>
                    <textarea 
                      value={form.bio || ''} 
                      onChange={e => setForm({...form, bio: e.target.value})} 
                      rows={3}
                      className={`w-full p-4 rounded-xl border outline-none text-sm font-medium resize-none ${theme.input}`} 
                      placeholder="Décrivez votre activité..."
                    />
                  </div>

                  {/* SECTION CONTRAT */}
                  <div className={`p-6 rounded-2xl border ${dark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#6c47ff]/20 flex items-center justify-center text-[#6c47ff]">
                        <FileText size={16} />
                      </div>
                      <h3 className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>Charte de l'Organisateur</h3>
                    </div>
                    
                    <div className={`text-[10px] md:text-xs leading-relaxed mb-6 max-h-32 overflow-y-auto pr-2 custom-scrollbar ${theme.sub}`}>
                      <p className="mb-3">En utilisant les services de <strong>TickoFiesta</strong>, vous acceptez les points suivants :</p>
                      <ul className="list-disc pl-4 space-y-2">
                        <li>Transparence totale sur les règlements des concours de votes.</li>
                        <li>Protection stricte des données personnelles des votants.</li>
                        <li>Utilisation d'un numéro Mobile Money valide pour les reversements.</li>
                        <li>Acceptation des commissions de plateforme (exonération sur le 1er événement).</li>
                      </ul>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center mt-1">
                        <input 
                          type="checkbox" 
                          checked={form.accepted_privacy_policy}
                          onChange={e => setForm({...form, accepted_privacy_policy: e.target.checked})}
                          className="w-5 h-5 rounded-md border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff] transition-all cursor-pointer" 
                        />
                      </div>
                      <span className={`text-[11px] md:text-xs font-bold leading-snug ${theme.text} group-hover:text-[#6c47ff] transition-colors`}>
                        Je confirme l'exactitude de ces informations et j'accepte les clauses de confidentialité liées à mon compte organisateur.
                      </span>
                    </label>
                  </div>

                  {/* Bouton de sauvegarde */}
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Enregistrer et Certifier le compte
                  </button>

                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}