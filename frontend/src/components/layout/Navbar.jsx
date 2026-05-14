import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { supabase } from '../../config/supabaseClient';
import {
  Sun, Moon, LogOut, MapPin, 
  Facebook, Instagram, Store, UserCircle, 
  Ticket, Zap, LayoutDashboard, X
} from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);

  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const userMenuRef = useRef(null);

  // Récupération des données du profil (Nom et Avatar)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('nom, avatar_url')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      } catch (err) {
        console.warn("Erreur profil:", err.message);
      }
    };
    fetchProfile();
  }, [user?.id]);

  // Gestion du style au scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fermeture du menu au clic à l'extérieur
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setUserMenuOpen(false);
    navigate('/');
  };

  // Masquer la Navbar sur les pages d'administration technique
  const isAdminArea = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');
  if (isAdminArea) return null;

  const meta = user?.user_metadata || {};
  const displayName = profile?.nom || meta.full_name || user?.email?.split('@')[0] || 'Client';
  const role = String(meta.role || user?.role || 'client').toLowerCase();
  const avatarUrl = profile?.avatar_url || meta.avatar_url;

  const navBg = dark ? 'bg-[#0a0a16]/95' : 'bg-white/95';

  return (
    <>
      {/* Spacer pour compenser la navbar fixe */}
      <div className={`w-full transition-all ${scrolled ? 'h-[76px]' : 'h-[76px] md:h-[116px]'}`} />

      <header className="fixed top-0 left-0 right-0 z-[100] w-full flex flex-col">
        {/* TOP BAR (Infos & Réseaux) */}
        {!scrolled && (
          <div className={`hidden md:block h-10 border-b ${dark ? 'bg-[#080812] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
              <div className="flex items-center gap-4">
                <MapPin size={12} className="text-[#6c47ff]" /> Abidjan, Côte d'Ivoire
              </div>
              <div className="flex items-center gap-6">
                <div className="flex gap-4">
                  <Facebook size={14} className="hover:text-[#6c47ff] cursor-pointer transition-colors" />
                  <Instagram size={14} className="hover:text-[#6c47ff] cursor-pointer transition-colors" />
                </div>
                <Link to="/points-de-vente" className="flex items-center gap-2 text-[#00d4aa] hover:opacity-80">
                  <Store size={12} /> Points de vente
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MAIN NAVIGATION */}
        <nav className={`w-full backdrop-blur-xl border-b transition-all duration-300 ${navBg} ${dark ? 'border-white/5' : 'border-slate-200'} ${scrolled ? 'py-3 shadow-xl' : 'py-5'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
            
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className={`relative transition-all duration-300 ${scrolled ? 'w-9 h-9' : 'w-12 h-12 md:w-14 md:h-14'}`}>
    <img 
      src="/images/logo.png" 
      alt="TickoFiesta" 
      className="w-full h-full object-contain"
      // Si ton logo est petit, utilise une version 2x :
      // srcSet="/images/logo.png 1x, /images/logo@2x.png 2x"
    />
              </div>
                  <span className={`font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] transition-all ${scrolled ? 'text-xl' : 'text-2xl md:text-'}`}>
                       TICKOFIESTA
                    </span>
                </Link>

            <div className="flex-1" />

            <div className="flex items-center gap-3 md:gap-5">
              {/* RACCOURCI BILLETS (Uniquement Client connecté) */}
              {user && role === 'client' && (
                <Link to="/mes-billets" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6c47ff]/10 text-[#6c47ff] hover:bg-[#6c47ff] hover:text-white transition-all border border-[#6c47ff]/20">
                   <Ticket size={18} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Mes Billets</span>
                </Link>
              )}

              {/* TOGGLE THEME */}
              <button onClick={() => dispatch(toggleTheme())} className={`p-2.5 rounded-xl transition-all ${dark ? 'bg-white/5 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* USER MENU */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)} 
                  className={`flex items-center gap-3 pl-4 pr-2 py-2 rounded-xl border transition-all ${dark ? 'border-white/10 bg-[#12121f]' : 'border-slate-200 bg-white shadow-sm hover:border-[#6c47ff]'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">
                    {user ? 'Mon Compte' : 'Menu'}
                  </span>
                  {user ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden border-2 border-[#6c47ff]/20 bg-slate-800">
                      <img 
                        src={avatarUrl || `https://ui-avatars.com/api/?name=${displayName}&background=6c47ff&color=fff`} 
                        alt={displayName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : (
                    <UserCircle size={26} className="text-[#6c47ff]" />
                  )}
                </button>

                {/* DROPDOWN MENU */}
                {userMenuOpen && (
                  <div className={`absolute right-0 top-full mt-3 w-64 rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 ${dark ? 'bg-[#0f0f1a]/95 border-white/10' : 'bg-white border-slate-200'}`}>
                    {user ? (
                      <>
                        <div className="p-4 border-b border-inherit flex items-center gap-3 bg-slate-50/50 dark:bg-white/5">
                          <img src={avatarUrl || `https://ui-avatars.com/api/?name=${displayName}`} className="w-10 h-10 rounded-lg object-cover shadow-sm" alt="" />
                          <div className="overflow-hidden">
                            <p className="text-sm font-black truncate text-slate-900 dark:text-white">{displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        
                        <div className="p-2 flex flex-col gap-1">
                          <Link to="/mes-billets" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-[#6c47ff]/10 rounded-xl transition-all text-slate-700 dark:text-slate-200">
                            <Ticket size={16} className="text-[#6c47ff]" /> Mes Billets
                          </Link>
                          
                          <Link to="/mes-votes" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-[#6c47ff]/10 rounded-xl transition-all text-slate-700 dark:text-slate-200">
                            <Zap size={16} className="text-[#f5a623]" /> Mes Votes
                          </Link>

                          {/* ADMINISTRATION : Réservé au staff */}
                          {(role === 'admin' || role === 'organisateur') && (
                            <>
                              <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                              <Link to={role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-blue-600">
                                <LayoutDashboard size={16} /> Administration
                              </Link>
                            </>
                          )}

                          <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                          
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-xl transition-all w-full text-left">
                            <LogOut size={16} /> Déconnexion
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 flex flex-col gap-2">
                        <Link to="/login" onClick={() => setUserMenuOpen(false)} className="w-full py-3 text-center text-[11px] font-black uppercase bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">Connexion</Link>
                        <Link to="/register" onClick={() => setUserMenuOpen(false)} className="w-full py-3 text-center text-[11px] font-black uppercase bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white rounded-xl shadow-lg transition-transform active:scale-95">S'inscrire</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}