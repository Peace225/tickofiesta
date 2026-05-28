import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { supabase } from '../../config/supabaseClient';
import {
  Sun, Moon, LogOut, MapPin, 
  Facebook, Instagram, Store, UserCircle, 
  Ticket, ShoppingCart, CheckSquare, CreditCard, Settings
} from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);
  const cartItems = useSelector((s) => s.cart?.items || []);

  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [profile, setProfile] = useState(null);
  const userMenuRef = useRef(null);

  const meta = user?.user_metadata || {};
  const role = String(meta.role || user?.role || 'client').toLowerCase();

  useEffect(() => {
    if (cartItems.length > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('nom, avatar_url').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const isAdminArea = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');
  if (isAdminArea) return null;

  const displayName = profile?.nom || user?.email?.split('@')[0] || 'Client';
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}`;

  return (
    <>
      <div className="w-full h-[70px] md:h-[116px]" /> 
      
      <header className="fixed top-0 left-0 right-0 z-[100] w-full flex flex-col">
        {/* TOP BAR */}
        <div className={`hidden md:flex h-10 border-b ${dark ? 'bg-[#080812] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-70">
            <div className="flex items-center gap-4"><MapPin size={12} className="text-[#6c47ff]" /> Abidjan, Côte d'Ivoire</div>
            <div className="flex items-center gap-6">
              <div className="flex gap-4"><Facebook size={14} /><Instagram size={14} /></div>
              <Link to="/points-de-vente" className="flex items-center gap-2 text-[#00d4aa] hover:opacity-80">
                <Store size={12} /> Points de vente
              </Link>
            </div>
          </div>
        </div>

        {/* MAIN NAV */}
        <nav className={`w-full backdrop-blur-xl border-b transition-all duration-300 ${dark ? 'bg-[#0a0a16]/95 border-white/5' : 'bg-white/95 border-slate-200'} ${scrolled ? 'py-2 md:py-3 shadow-xl' : 'py-3 md:py-4'}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between gap-1 md:gap-2">
            
            {/* LOGO - Le texte est maintenant visible et plus grand sur mobile */}
            <Link to="/" className="flex items-center gap-2 md:gap-2.5 flex-shrink-0">
              <img 
                src="/images/logo1.png" 
                alt="TickoFiesta" 
                className={`object-contain transition-all duration-300 ${scrolled ? 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10' : 'w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12'}`} 
              />
              <span className={`font-black gradient-text tracking-tight transition-all duration-300 ${scrolled ? 'text-[18px] sm:text-xl md:text-2xl' : 'text-[22px] sm:text-2xl md:text-3xl'}`}>
                TICKOFIESTA
              </span>
            </Link>

            {/* Navigation Icons & Actions */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-4 flex-1">
              
              {user && role === 'client' && (
                <Link to="/cart" className={`relative p-1.5 md:p-2.5 rounded-xl transition-all ${dark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <ShoppingCart size={18} className={animate ? 'animate-bounce-cart' : ''} />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 p-1 min-w-[18px] min-h-[18px] bg-[#6c47ff] text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-md">
                      {cartItems.length}
                    </span>
                  )}
                </Link>
              )}

              <button onClick={() => dispatch(toggleTheme())} className={`p-1.5 md:p-2.5 rounded-xl transition-all ${dark ? 'bg-white/5 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="relative" ref={userMenuRef}>
                {user && role === 'client' ? (
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 border rounded-xl p-1 md:pr-3 shadow-sm hover:border-[#6c47ff] transition-colors">
                    <img src={avatarUrl} className="w-7 h-7 md:w-8 md:h-8 rounded-lg object-cover" alt="avatar" />
                    <span className="text-xs font-bold hidden md:block">Mon Compte</span>
                  </button>
                ) : (
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className={`flex items-center gap-1.5 border rounded-xl p-1 md:p-1.5 md:pr-3 shadow-sm hover:border-[#6c47ff] transition-colors ${dark ? 'border-white/10' : 'border-slate-200'}`}>
                    <UserCircle size={22} className="text-[#6c47ff]" />
                    <span className="text-xs font-bold hidden md:block">Compte</span>
                  </button>
                )}

                {userMenuOpen && (
                  <div className={`absolute right-0 top-full mt-3 w-56 md:w-64 rounded-2xl border shadow-2xl z-50 animate-fade-in ${dark ? 'bg-[#0f0f1a] border-white/10' : 'bg-white border-slate-200'}`}>
                    {user && role === 'client' ? (
                      <>
                        {/* En-tête du menu avec les infos de l'utilisateur */}
                        <div className={`px-4 py-4 rounded-t-2xl border-b mb-1 flex items-center gap-3 ${dark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                          <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black truncate">{displayName}</p>
                            <p className={`text-[11px] font-medium truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 p-1.5">
                          {/* Action Principale */}
                          <Link to="/mes-billets" onClick={() => setUserMenuOpen(false)} className={`group flex items-center justify-between px-3 py-3 md:py-2.5 text-xs font-black uppercase rounded-xl transition-all active:scale-95 ${dark ? 'bg-[#6c47ff]/20 text-[#6c47ff] hover:bg-[#6c47ff]/30' : 'bg-[#6c47ff]/10 text-[#6c47ff] hover:bg-[#6c47ff]/20'}`}>
                            <div className="flex items-center gap-3">
                              <Ticket size={18} className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                              Mes Billets
                            </div>
                          </Link>

                          {/* Actions Secondaires */}
                          <Link to="/client/votes" onClick={() => setUserMenuOpen(false)} className="group flex items-center gap-3 px-3 py-3 md:py-2.5 text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95">
                            <CheckSquare size={18} className={`transition-transform duration-300 group-hover:scale-110 ${dark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-black'}`} /> 
                            Mes Votes
                          </Link>
                          
                          <Link to="/client/transactions" onClick={() => setUserMenuOpen(false)} className="group flex items-center gap-3 px-3 py-3 md:py-2.5 text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95">
                            <CreditCard size={18} className={`transition-transform duration-300 group-hover:scale-110 ${dark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-black'}`} /> 
                            Transactions
                          </Link>

                          <Link to="/client/profile" onClick={() => setUserMenuOpen(false)} className="group flex items-center gap-3 px-3 py-3 md:py-2.5 text-xs font-bold uppercase hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95">
                            <Settings size={18} className={`transition-transform duration-300 group-hover:scale-110 ${dark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-black'}`} /> 
                            Mon Profil
                          </Link>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-3" />

                        {/* Déconnexion */}
                        <div className="p-1.5">
                          <button onClick={handleLogout} className="group w-full flex items-center gap-3 px-3 py-3 md:py-2.5 text-xs font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95">
                            <LogOut size={18} className="transition-transform duration-300 group-hover:-translate-x-1" /> 
                            Déconnexion
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 p-1 md:p-2">
                        <Link to="/login" onClick={() => setUserMenuOpen(false)} className="w-full py-3 text-center text-[11px] font-black uppercase bg-slate-50 dark:bg-white/5 hover:bg-slate-100 rounded-xl">
                          Connexion
                        </Link>
                        <Link to="/register" onClick={() => setUserMenuOpen(false)} className="w-full py-3 text-center text-[11px] font-black uppercase bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white rounded-xl shadow-lg">
                          S'inscrire
                        </Link>
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