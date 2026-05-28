import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import { loginSuccess } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Mail, Eye, EyeOff, Sparkles, X, Smartphone, Loader2, User, CheckCircle2, ArrowRight, Lock } from 'lucide-react';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const dark = useSelector((s) => s.theme?.dark) ?? false;

  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    role: searchParams.get('role') === 'organisateur' ? 'organisateur' : 'client',
    accepteConditions: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accepteConditions) return toast.error('Acceptez les conditions.');
    if (!form.nom.trim()) return toast.error('Nom complet requis');
    if (!form.email.includes('@')) return toast.error('Email invalide');
    if (form.mot_de_passe.length < 6) return toast.error('6 caractères minimum pour le mot de passe');

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.mot_de_passe,
        options: {
          data: {
            nom: form.nom.trim(),
            role: form.role,
            telephone: form.telephone.trim()
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Cet email est déjà utilisé.');
        }
        throw error;
      }
      
      if (!data.session) {
        setShowSuccessModal(true);
      } else {
        await finalizeRegistration(data.user, data.session);
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin, scopes: 'email public_profile' }
    });
    if (error) toast.error(error.message);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) toast.error(error.message);
  };

  const finalizeRegistration = async (authUser, session) => {
    dispatch(loginSuccess({
      user: { ...authUser, role: form.role },
      session
    }));
    toast.success('Bienvenue sur TICKOFIESTA ! 🎉');
    navigate(form.role === 'organisateur' ? '/dashboard' : '/');
  };

  // Thème Premium "Apple Style"
  const apple = {
    page: dark ? 'bg-[#000000]' : 'bg-[#f5f5f7]',
    card: dark
      ? 'bg-[#1c1c1e]/80 border-white/10 shadow-2xl shadow-black/50'
      : 'bg-white/80 border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]',
    text: dark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]',
    sub: dark ? 'text-[#98989d]' : 'text-[#86868b]',
    input: dark
      ? 'bg-[#2c2c2e] text-white placeholder-[#98989d] focus:ring-white/20 focus:bg-[#3a3a3c]'
      : 'bg-[#f5f5f7] text-[#1d1d1f] placeholder-[#86868b] focus:ring-black/10 focus:bg-white',
    socialBox: dark ? 'bg-[#2c2c2e]' : 'bg-[#f5f5f7]',
    socialHover: dark ? 'hover:bg-[#3a3a3c]' : 'hover:bg-[#e8e8ed]',
    segmentBg: dark ? 'bg-[#2c2c2e]' : 'bg-[#e3e3e8]',
    segmentActive: dark ? 'bg-[#1c1c1e] text-white shadow-md' : 'bg-white text-[#1d1d1f] shadow-sm',
    segmentInactive: dark ? 'text-[#98989d] hover:text-white' : 'text-[#86868b] hover:text-[#1d1d1f]',
  };

  return (
    <div className={`min-h-screen flex ${apple.page} font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display',Inter,sans-serif] transition-colors duration-500`}>
      
      {/* Branding gauche (Identique au Login) */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0">
          <img src="/fond ecran evenement.jpg" alt="TickoFiesta Background" className="w-full h-full object-cover opacity-40 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
        </div>
        <div className="relative z-10 text-center px-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-[1.25rem] bg-white flex items-center justify-center shadow-2xl">
              <Sparkles size={28} className="text-[#6c47ff]" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">TickoFiesta</span>
          </div>
          <h2 className="text-6xl font-bold leading-[1.05] tracking-[-0.03em] text-white">
            Rejoignez<br />le mouvement.
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-white/70 max-w-sm mx-auto font-medium">
            Créez votre compte pour réserver, voter ou organiser vos propres événements en toute simplicité.
          </p>
        </div>
      </div>

      {/* Carte Registration droite */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-700 py-8">
          
          <div className={`backdrop-blur-3xl rounded-[2rem] border p-10 lg:p-12 ${apple.card}`}>
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold tracking-tight ${apple.text}`}>Créer un compte</h1>
              <p className={`text-sm mt-2 font-medium ${apple.sub}`}>Rejoignez la communauté TickoFiesta</p>
            </div>

            {/* Sélecteur de rôle façon iOS Segmented Control */}
            <div className={`flex p-1 rounded-[1rem] mb-8 ${apple.segmentBg}`}>
              {['client', 'organisateur'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2.5 rounded-[14px] text-[13px] font-semibold tracking-wide transition-all duration-300 ${form.role === r ? apple.segmentActive : apple.segmentInactive}`}
                >
                  {r === 'client' ? 'Participant' : 'Organisateur'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <User size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#0071e3] ${apple.sub}`} />
                <input
                  type="text" required value={form.nom} placeholder="Nom complet"
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className={`w-full h-14 pl-12 pr-4 rounded-[1rem] text-[15px] font-medium outline-none ring-2 ring-transparent transition-all shadow-sm ${apple.input}`}
                />
              </div>

              <div className="relative group">
                <Mail size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#0071e3] ${apple.sub}`} />
                <input
                  type="email" required value={form.email} placeholder="Adresse e-mail"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full h-14 pl-12 pr-4 rounded-[1rem] text-[15px] font-medium outline-none ring-2 ring-transparent transition-all shadow-sm ${apple.input}`}
                />
              </div>

              <div className="relative group">
                <Smartphone size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#0071e3] ${apple.sub}`} />
                <input
                  type="tel" value={form.telephone} placeholder="Numéro de téléphone (optionnel)"
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className={`w-full h-14 pl-12 pr-4 rounded-[1rem] text-[15px] font-medium outline-none ring-2 ring-transparent transition-all shadow-sm ${apple.input}`}
                />
              </div>

              <div className="relative group">
                <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#0071e3] ${apple.sub}`} />
                <input
                  type={showPwd ? 'text' : 'password'} required autoComplete="new-password"
                  value={form.mot_de_passe} placeholder="Mot de passe (6 car. min)"
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                  className={`w-full h-14 pl-12 pr-12 rounded-[1rem] text-[15px] font-medium outline-none ring-2 ring-transparent transition-all shadow-sm ${apple.input}`}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${apple.sub}`}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <label className="flex items-start gap-3 mt-4 cursor-pointer pt-2 pb-4">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox" checked={form.accepteConditions}
                    onChange={() => setForm({ ...form, accepteConditions: !form.accepteConditions })}
                    className="w-5 h-5 appearance-none border-2 border-gray-300 dark:border-gray-600 rounded-md checked:bg-[#0071e3] checked:border-[#0071e3] transition-colors cursor-pointer"
                  />
                  {form.accepteConditions && <CheckCircle2 size={14} className="absolute text-white pointer-events-none" />}
                </div>
                <span className={`text-[13px] leading-snug ${apple.sub}`}>
                  J'accepte les <button type="button" onClick={(e) => { e.preventDefault(); setShowContractModal(true); }} className="text-[#0071e3] font-semibold hover:underline">Conditions Générales d'Utilisation</button> et la politique de confidentialité.
                </span>
              </label>

              <button
                type="submit" disabled={loading || !form.accepteConditions}
                className="w-full h-14 rounded-[1rem] bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-[15px] font-semibold flex items-center justify-center gap-2 hover:opacity-80 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-black/10 dark:shadow-white/10"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <>Créer mon compte <ArrowRight size={18} className="opacity-80" /></>}
              </button>
            </form>

            <div className="relative flex items-center my-8">
              <div className="flex-1 h-px bg-black/5 dark:bg-white/10" />
              <span className={`px-4 text-xs font-semibold uppercase tracking-widest ${apple.sub}`}>Ou via</span>
              <div className="flex-1 h-px bg-black/5 dark:bg-white/10" />
            </div>

            <div className={`flex items-center p-1.5 rounded-2xl transition-colors ${apple.socialBox}`}>
              <button type="button" onClick={handleGoogleLogin} disabled={loading} className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] ${apple.socialHover}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className={`text-sm font-semibold ${apple.text}`}>Google</span>
              </button>
              <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />
              <button type="button" onClick={handleFacebookLogin} disabled={loading} className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] ${apple.socialHover}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className={`text-sm font-semibold ${apple.text}`}>Facebook</span>
              </button>
            </div>

          </div>
          
          <p className={`text-center text-[15px] font-medium mt-10 ${apple.sub}`}>
            Déjà un compte ?{' '}
            <Link to="/login" className="text-[#0071e3] font-semibold hover:text-[#005bb5] transition-colors">Connexion</Link>
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => navigate('/login')}>
          <div className={`w-full max-w-sm rounded-[2rem] p-8 ${apple.card} text-center border shadow-2xl animate-in zoom-in-95`} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[#34C759]/10 text-[#34C759] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className={`text-2xl font-bold tracking-tight mb-3 ${apple.text}`}>Compte créé !</h3>
            <p className={`${apple.sub} text-[15px] leading-relaxed mb-8 font-medium`}>
              Un e-mail de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception pour activer votre compte.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] h-14 rounded-[1rem] font-semibold hover:opacity-80 transition-opacity"
            >
              Aller à la connexion
            </button>
          </div>
        </div>
      )}

      {/* CGU Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setShowContractModal(false)}>
          <div className={`w-full max-w-2xl rounded-[2rem] p-8 ${apple.card} border shadow-2xl animate-in zoom-in-95`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className={`text-2xl font-bold tracking-tight ${apple.text}`}>Conditions Générales</h3>
              <button onClick={() => setShowContractModal(false)} className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${apple.sub}`}>
                <X size={20} />
              </button>
            </div>
            <div className={`prose prose-sm dark:prose-invert max-w-none max-h-[50vh] overflow-y-auto mb-8 pr-4 custom-scrollbar ${apple.sub}`}>
              <p>En créant un compte sur TickoFiesta, vous acceptez l'intégralité de nos Conditions Générales d'Utilisation ainsi que notre politique de gestion des données personnelles...</p>
              {/* Ajoutez le texte complet de vos CGU ici */}
            </div>
            <button
              onClick={() => { setForm({ ...form, accepteConditions: true }); setShowContractModal(false); }}
              className="w-full bg-[#000000] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] h-14 rounded-[1rem] font-semibold hover:opacity-80 transition-opacity"
            >
              J'accepte et je continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}