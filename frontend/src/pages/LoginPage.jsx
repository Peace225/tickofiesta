import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import { supabase } from '../config/supabaseClient';
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
  const [supaUser, setSupaUser] = useState(null);
  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setSupaUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) setSupaUser(session.user);
      if (event === 'SIGNED_OUT') setSupaUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const effectiveUser = user || supaUser;

  useEffect(() => {
    if (!effectiveUser) return;

    (async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_verified')
        .eq('id', effectiveUser.id)
        .single();

      if (profileError) return;

      const userRole = String(profile?.role || 'client').toLowerCase();

      if (userRole === 'organisateur' && !profile.is_verified) {
        toast.error('Votre compte est en attente de validation.');
        await supabase.auth.signOut();
        return;
      }

      if (['admin', 'super_admin', 'superadmin'].includes(userRole)) {
        navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true });
      } else if (userRole === 'organisateur') {
        navigate(from?.startsWith('/dashboard') ? from : '/dashboard', { replace: true });
      } else {
        navigate(from && !['/login', '/register'].includes(from) ? from : '/', { replace: true });
      }
    })();
  }, [effectiveUser, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const idString = form.identifiant.trim();
    const isEmail = idString.includes('@');
    let loginPayload = { password: form.mot_de_passe };
    
    if (isEmail) {
      loginPayload.email = idString;
    } else {
      let phone = idString.replace(/\s+/g, '');
      if (phone.startsWith('00')) phone = '+' + phone.substring(2);
      if (!phone.startsWith('+')) phone = '+225' + phone.slice(-10);
      loginPayload.phone = phone;
    }

    const result = await dispatch(login(loginPayload));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Heureux de vous revoir sur TickoFiesta! 👋');
    }
  };

  const apple = {
    page: dark ? 'bg-[#000000]' : 'bg-[#f5f5f7]',
    card: dark ? 'bg-[#1c1c1e]/80 border-white/10 shadow-2xl shadow-black/50' : 'bg-white/80 border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]',
    text: dark ? 'text-[#f5f5f7]' : 'text-[#1d1d1f]',
    sub: dark ? 'text-[#98989d]' : 'text-[#86868b]',
    input: dark ? 'bg-[#2c2c2e] text-white placeholder-[#98989d] focus:ring-white/20' : 'bg-[#f5f5f7] text-[#1d1d1f] placeholder-[#86868b] focus:ring-black/10',
    socialBox: dark ? 'bg-[#2c2c2e]' : 'bg-[#f5f5f7]',
    socialHover: dark ? 'hover:bg-[#3a3a3c]' : 'hover:bg-[#e8e8ed]',
  };

  return (
    <div className={`min-h-screen flex ${apple.page} font-sans transition-colors duration-500`}>
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0">
          <img src="/fond ecran evenement.jpg" alt="Background" className="w-full h-full object-cover opacity-40 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-[1.25rem] bg-white flex items-center justify-center shadow-2xl">
              <Sparkles size={28} className="text-[#6c47ff]" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">TickoFiesta</span>
          </div>
          <h2 className="text-6xl font-bold text-white leading-[1.05]">Vivez<br />l'instant.</h2>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[440px]">
          <div className={`backdrop-blur-3xl rounded-[2rem] border p-10 lg:p-12 ${apple.card}`}>
            <div className="text-center mb-10">
              <h1 className={`text-3xl font-bold ${apple.text}`}>Connexion</h1>
              <p className={`text-sm mt-2 font-medium ${apple.sub}`}>Accédez à votre compte</p>
            </div>

            <div className={`flex items-center p-1.5 rounded-2xl mb-8 ${apple.socialBox}`}>
              <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 ${apple.socialHover}`}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className={`text-sm font-semibold ${apple.text}`}>Google</span>
              </button>
              <div className="w-px h-6 bg-black/10 mx-1" />
              <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'facebook' })} className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 ${apple.socialHover}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                <span className={`text-sm font-semibold ${apple.text}`}>Facebook</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${apple.sub}`} />
                <input type="text" required value={form.identifiant} onChange={(e) => setForm({ ...form, identifiant: e.target.value })} placeholder="Email ou téléphone" className={`w-full h-14 pl-12 pr-4 rounded-[1rem] ${apple.input}`} />
              </div>
              <div className="relative">
                <Lock size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 ${apple.sub}`} />
                <input type={showPwd ? 'text' : 'password'} required value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} placeholder="Mot de passe" className={`w-full h-14 pl-12 pr-12 rounded-[1rem] ${apple.input}`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${apple.sub}`}>
                  {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full h-14 rounded-[1rem] bg-[#000000] dark:bg-[#ffffff] text-white dark:text-black font-semibold mt-2 flex items-center justify-center">
                {loading ? <Loader2 size={20} className="animate-spin" /> : <>Se connecter <ArrowRight size={18} className="ml-2" /></>}
              </button>
            </form>
          </div>
          <p className={`text-center text-sm mt-10 ${apple.sub}`}>
            Nouveau sur TickoFiesta ? <Link to="/register" className="text-[#0071e3] font-semibold">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}