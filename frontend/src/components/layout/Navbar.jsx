import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { supabase } from '../../config/supabaseClient';
import toast from 'react-hot-toast'; // <-- Ajout de l'import toast
import {
  Sun, Moon, LogOut, MapPin, 
  Facebook, Instagram, Store, UserCircle, 
  Ticket, ShoppingCart, LayoutDashboard, Shield,
  Users, Bell, Heart, UserPlus
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

  const role = String(user?.role || 'client').toLowerCase();

  // Animations panier
  useEffect(() => {
    if (cartItems.length > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length]);

  // Récupération profil
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('nom, avatar_url').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user?.id]);

  // Écoute scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fermeture menu au clic extérieur
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

  // --- NOUVELLE LOGIQUE : Clic sur l'icône communauté ---
  const handleCommunityClick = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/community');
    } else {
      toast('Veuillez vous connecter pour rejoindre la communauté !', {
        icon: '🔒',
        style: {
          borderRadius: '10px',
          background: dark ? '#1e1e2d' : '#fff',
          color: dark ? '#fff' : '#333',
        },
      });
      navigate('/login');
    }
  };

  // On ne rend pas la Navbar client sur les espaces d'administration
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
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 flex items-center justify-between">
            
            <Link to="/" className="flex items-center gap-2 md:gap-2.5 flex-shrink-0">
              <img src="/images/logo1.png" alt="TickoFiesta" className={`object-contain transition-all duration-300 ${scrolled ? 'w-8 h-8' : 'w-10 h-10'}`} />
              <span className="font-black gradient-text tracking-tight text-xl md:text-2xl">TICKOFIESTA</span>
            </Link>

            <div className="flex items-center justify-end gap-2 md:gap-4">
              
              {/* CONTENEUR DES ICÔNES DE NAVIGATION */}
              <div className="flex items-center gap-1 sm:gap-2 mr-1">
                
                {/* 1. ICÔNE COMMUNAUTÉ : Visible par tous, protégée par le clic */}
                <button 
                  onClick={handleCommunityClick} 
                  className={`p-2 rounded-full transition-all ${dark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-slate-100'}`} 
                  title="La communauté"
                >
                  <Users size={20} strokeWidth={2.5} />
                </button>
                
                {/* 2. NOTIFICATIONS & FAVORIS : Visibles uniquement si connecté */}
                {user && (
                  <>
                    <Link to="/notifications" className={`relative p-2 rounded-full transition-all ${dark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-slate-100'}`} title="Notifications">
                      <Bell size={20} strokeWidth={2.5} />
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a16]"></span>
                    </Link>
                    <Link to="/favorites" className={`p-2 rounded-full transition-all ${dark ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-slate-100'}`} title="Événements favoris">
                      <Heart size={20} strokeWidth={2.5} />
                    </Link>
                  </>
                )}
              </div>

              <button onClick={() => dispatch(toggleTheme())} className={`p-2 rounded-xl ${dark ? 'bg-white/5' : 'bg-slate-100'}`}>
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* CONTENEUR MENU UTILISATEUR */}
              <div className="relative z-[100]" ref={userMenuRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }} 
                  className="flex items-center gap-2 border rounded-xl p-1 md:pr-3 shadow-sm hover:border-[#6c47ff] transition-colors"
                >
                  {user ? <img src={avatarUrl} className="w-8 h-8 rounded-lg object-cover" alt="avatar" /> : <UserCircle size={22} className="text-[#6c47ff]" />}
                  <span className="text-xs font-bold hidden md:block">Mon Compte</span>
                </button>

                {userMenuOpen && (
                  <div className={`absolute right-0 top-full mt-3 w-56 rounded-2xl border shadow-2xl ${dark ? 'bg-[#0f0f1a] border-white/10' : 'bg-white border-slate-200'}`}>
                    {user ? (
                      <>
                        <div className="p-4 border-b">
                          <p className="text-sm font-black truncate">{displayName}</p>
                          <p className="text-[10px] truncate opacity-60">{user.email}</p>
                        </div>
                        <div className="p-1.5">
                          
                          {/* 1. RÔLE : ADMINISTRATEUR */}
                          {['admin', 'super_admin', 'superadmin'].includes(role) && (
                            <div className="pb-1 border-b mb-1 border-slate-100 dark:border-white/5">
                              <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                                <Shield size={14} /> Espace Admin
                              </Link>
                            </div>
                          )}

                          {/* 2. RÔLE : ORGANISATEUR */}
                          {role === 'organisateur' && (
                            <div className="pb-1 border-b mb-1 border-slate-100 dark:border-white/5">
                              <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-black text-[#6c47ff] hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg">
                                <LayoutDashboard size={14} /> Espace Organisateur
                              </Link>
                            </div>
                          )}

                          {/* 3. RÔLE : CLIENT */}
                          {role === 'client' && (
                            <div className="pb-1 border-b mb-1 border-slate-100 dark:border-white/5">
                              <Link to="/client/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-black text-[#00d4aa] hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg mb-1">
                                <UserCircle size={14} /> Mon Espace Client
                              </Link>
                              
                              {/* BOUTON INVITER UN AMI DANS LE MENU */}
                              <Link to="/client/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#6c47ff] hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg">
                                <UserPlus size={14} /> Inviter un ami
                              </Link>
                            </div>
                          )}

                          {/* LIEN COMMUN : BILLETS */}
                          <Link to={role === 'client' ? "/client/billets" : "/mes-billets"} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                            <Ticket size={14} /> Mes Billets
                          </Link>
                          
                          <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                            <LogOut size={14} /> Déconnexion
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2">
                        <Link to="/login" className="block w-full py-2 text-center text-xs font-black uppercase bg-slate-100 dark:bg-slate-800 rounded-xl mb-1">Connexion</Link>
                        <Link to="/register" className="block w-full py-2 text-center text-xs font-black uppercase bg-[#6c47ff] text-white rounded-xl">S'inscrire</Link>
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