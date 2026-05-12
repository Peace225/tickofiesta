import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { 
  Lock, Eye, EyeOff, ArrowRight, 
  Sparkles, User, Loader2 
} from 'lucide-react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const { loading, error, user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);
  
  const [form, setForm] = useState({ identifiant: '', mot_de_passe: '' });
  const [showPwd, setShowPwd] = useState(false);

  // Sécurité sur le chemin de retour
  const from = location.state?.from?.pathname || null;

  // =========================================================================
  // 1. LOGIQUE DE REDIRECTION INTELLIGENTE
  // =========================================================================
  useEffect(() => {
    if (user) {
      // Priorité 1 : Retourner à la page précédente (ex: un vote en cours)
      if (from && from !== '/login' && from !== '/register') {
        navigate(from, { replace: true });
        return;
      }

      // Priorité 2 : Redirection par rôle
      const rawRole = user?.user_metadata?.role || user?.role || 'client';
      const userRole = String(rawRole).toLowerCase();

      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'organisateur') {
        navigate('/dashboard', { replace: true });
      } else {
        // Le client reste sur l'interface publique pour voter/acheter
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate, from]);

  // Gestion propre des erreurs
  useEffect(() => {
    if (error) { 
      toast.error(error); 
      dispatch(clearError()); 
    }
  }, [error, dispatch]);

  // =========================================================================
  // 2. SOUMISSION DU FORMULAIRE
  // =========================================================================
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    
    // Supabase attend souvent "password" au lieu de "mot_de_passe"
    let loginCredentials = { password: form.mot_de_passe }; 
    let idString = form.identifiant.trim().replace(/\s+/g, ''); // Nettoyage des espaces

    if (idString.includes('@')) {
      loginCredentials.email = idString;
    } else {
      // Formatage international intelligent
      let formattedPhone = idString;
      if (formattedPhone.startsWith('00')) {
        formattedPhone = '+' + formattedPhone.substring(2);
      } else if (!formattedPhone.startsWith('+')) {
        // Ajout auto de l'indicatif CI par défaut si absent
        formattedPhone = '+225' + formattedPhone;
      }
      loginCredentials.phone = formattedPhone;
    }

    const result = await dispatch(login(loginCredentials));
    
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Heureux de vous revoir sur TickoFiesta ! 👋');
    }
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f4f7ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark 
      ? 'bg-[#0f0e1a] border-white/10 text-white placeholder-white/10 focus:border-[#6c47ff] focus:ring-[#6c47ff]/10' 
      : 'bg-white border-slate-200 text-gray-900 placeholder-slate-400 focus:border-[#6c47ff] focus:ring-[#6c47ff]/5',
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${theme.bg}`}>

      {/* PANEL GAUCHE : IDENTITÉ VISUELLE */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#05050a] flex-col justify-between p-16">
        <div className="absolute inset-0">
          <img 
            src="/fond ecran evenement.jpg" 
            alt="TickoFiesta Premium" 
            className="w-full h-full object-cover opacity-30 scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/40 to-transparent" />
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="text-2xl font-black tracking-tighter text-white flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center shadow-2xl shadow-[#6c47ff]/40">
               <Sparkles size={20} className="text-white fill-white/20" />
             </div>
             <span className="tracking-[0.1em]">TICKOFIESTA</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-7xl font-black text-white mb-8 leading-[0.9] tracking-tighter">
            VIVEZ <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">L'INSTANT.</span>
          </h2>
          <p className="text-white/60 text-xl leading-relaxed font-light">
            Accédez à vos billets exclusifs et soutenez vos candidats favoris en quelques clics.
          </p>
        </div>
        
        <div className="relative z-10 text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} TickoFiesta CI • Digital Excellence.
        </div>
      </div>

      {/* PANEL DROIT : FORMULAIRE */}
      <div className={`flex-1 flex items-center justify-center px-8 py-12 relative`}>
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-1000">

          <div className="mb-12">
            <h1 className={`text-5xl font-black tracking-tight mb-3 ${theme.text}`}>Connexion</h1>
            <p className={`text-lg font-medium opacity-60 ${theme.text}`}>Identifiez-vous pour continuer.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className={`text-[11px] font-black uppercase tracking-[0.2em] opacity-50 ${theme.text}`}>
                Email ou Téléphone (+225...)
              </label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c47ff] transition-transform group-focus-within:scale-110" />
                <input
                  type="text" 
                  required 
                  autoComplete="username"
                  value={form.identifiant}
                  onChange={(e) => setForm({ ...form, identifiant: e.target.value })}
                  className={`w-full pl-12 pr-4 py-5 rounded-2xl border text-base font-bold transition-all outline-none focus:ring-8 ${theme.input} shadow-sm`}
                  placeholder="votre@email.com ou +225..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-black uppercase tracking-[0.2em] opacity-50 ${theme.text}`}>
                  Mot de passe
                </label>
                <Link to="/forgot-password" className="text-[11px] font-bold text-[#6c47ff] hover:text-[#8b6bff] uppercase tracking-wider transition-colors">Oublié ?</Link>
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6c47ff] transition-transform group-focus-within:scale-110" />
                <input
                  type={showPwd ? 'text' : 'password'} 
                  required 
                  autoComplete="current-password"
                  value={form.mot_de_passe}
                  onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                  className={`w-full pl-12 pr-14 py-5 rounded-2xl border text-base font-bold transition-all outline-none focus:ring-8 ${theme.input} shadow-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button" 
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6c47ff] transition-colors p-1"
                >
                  {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#6c47ff]/30 transition-all active:scale-[0.98] flex items-center justify-center gap-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>Accéder au compte <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className={`mt-12 pt-8 border-t ${dark ? 'border-white/5' : 'border-slate-100'} text-center`}>
            <p className={`text-base font-medium ${theme.sub}`}>
              Pas encore membre ?{' '}
              <Link to="/register" className="text-[#6c47ff] font-black hover:underline underline-offset-4 decoration-2">Créer un compte</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}