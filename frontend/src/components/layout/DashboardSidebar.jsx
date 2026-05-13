import { useState, useMemo, useCallback, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { forceLogout } from '../../store/slices/authSlice';
import {
  LayoutDashboard, CalendarDays, Ticket,
  Settings, LogOut, TrendingUp, User, Vote,
  ChevronLeft, ChevronRight, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardSidebar = memo(() => {
  // 1. SÉLECTEURS CIBLÉS (Évite les re-rendus inutiles)
  const dark = useSelector((s) => s.theme.dark);
  const user = useSelector((s) => s.auth.user);
  
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // 2. MÉMORISATION DES LIENS
  const links = useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Événements', path: '/dashboard/events', icon: <CalendarDays size={20} /> },
    { name: 'Billetterie', path: '/dashboard/tickets', icon: <Ticket size={20} /> },
    { name: 'Votes', path: '/dashboard/votes', icon: <Vote size={20} /> },
    { name: 'Stats', path: '/dashboard/stats', icon: <TrendingUp size={20} /> },
    { name: 'Profil', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ], []);

  // Pré-calcul du menu mobile pour éviter le .filter() à chaque rendu
  const mobileLinks = useMemo(() => links.filter(l => l.name !== 'Stats'), [links]);

  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#0a0a16]/95 backdrop-blur-2xl border-white/5' : 'bg-white/95 backdrop-blur-2xl border-gray-100',
    text: dark ? 'text-white' : 'text-gray-900',
    sub: dark ? 'text-gray-400' : 'text-gray-500',
    userCard: dark ? 'bg-[#161527] border-white/5' : 'bg-gray-50 border-gray-100',
    toggleBtn: dark ? 'bg-[#161527] border-white/10 text-gray-400 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900'
  }), [dark]);

  // 3. DÉCONNEXION OPTIMISTE (Vitesse perçue instantanée)
  const handleLogout = useCallback(async () => {
    // Action immédiate côté client
    dispatch(forceLogout());
    navigate('/login');
    
    // Requête réseau en arrière-plan
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erreur de session réseau", error);
    }
  }, [dispatch, navigate]);

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} h-screen border-r hidden lg:flex flex-col sticky top-0 left-0 z-40 transition-all duration-300 ease-in-out ${theme.bg}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3.5 top-10 w-7 h-7 rounded-full flex items-center justify-center border shadow-md z-50 transition-transform duration-200 hover:scale-110 ${theme.toggleBtn}`}
          aria-label="Réduire le menu"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-8 flex items-center relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'justify-center px-4' : 'gap-4'}`}>
          <div className="w-12 h-12 flex-shrink-0 relative z-10 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4aa]">
            <Link to="/">
              <img 
                src="/logo.png" 
                alt="Logo TickoFiesta" 
                decoding="async" 
                className="w-full h-full object-cover" 
              />
            </Link>
          </div>
          {!isCollapsed && (
            <div className="relative z-10 flex flex-col justify-center animate-fade-in">
              <span className={`font-black text-2xl tracking-tighter ${theme.text}`}>TICKOFIESTA</span>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#00d4aa]">Organisateur</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden content-visibility-auto">
          <div className={`mb-6 ${isCollapsed ? 'px-2' : 'px-6'}`}>
            <Link to="/" className={`flex items-center transition-all duration-200 group ${isCollapsed ? 'justify-center w-14 h-14 mx-auto rounded-2xl text-gray-500 hover:bg-[#00d4aa]/10 hover:text-[#00d4aa]' : 'gap-4 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-[#00d4aa]/10 hover:text-[#00d4aa]'}`}>
              <Globe size={20} className="flex-shrink-0" />
              {!isCollapsed && <span>Accueil du site</span>}
            </Link>
          </div>

          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`flex items-center transition-all duration-200 ${isCollapsed ? 'justify-center w-14 h-14 mx-auto rounded-2xl mb-2 ' + (isActive ? 'bg-[#6c47ff]/10 text-[#6c47ff]' : 'text-gray-500 hover:bg-gray-500/10') : 'gap-4 px-10 py-4 rounded-r-2xl text-sm font-bold ' + (isActive ? 'bg-gradient-to-r from-[#6c47ff]/20 to-transparent border-l-4 border-[#6c47ff] text-[#6c47ff]' : 'text-gray-500 hover:bg-gray-50')}`}
              >
                <span className={`${isActive ? 'text-[#6c47ff]' : ''}`}>{link.icon}</span>
                {!isCollapsed && <span>{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
          <div className={`rounded-2xl border flex flex-col transition-colors ${theme.userCard} ${isCollapsed ? 'p-2 items-center' : 'p-4'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#6c47ff] overflow-hidden flex-shrink-0">
                <User size={18} className="text-white" />
              </div>
              {!isCollapsed && <div className="min-w-0"><p className={`text-sm font-black truncate ${theme.text}`}>{user?.nom || 'Organisateur'}</p></div>}
            </div>
            <button 
              onClick={handleLogout} 
              className={`mt-4 flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-200 ${isCollapsed ? 'w-10 h-10 rounded-xl' : 'w-full gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest'}`}
            >
              <LogOut size={16} /> {!isCollapsed && "Quitter"}
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className={`lg:hidden fixed bottom-0 left-0 w-full z-40 border-t pb-safe ${theme.bg}`}>
        <div className="flex items-center justify-around py-3 px-2">
          {mobileLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`flex flex-col items-center gap-1 transition-transform duration-200 ${isActive ? 'text-[#6c47ff] scale-110' : 'text-gray-400 hover:text-gray-300'}`}
              >
                {link.icon}
                <span className="text-[9px] font-bold">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
});

export default DashboardSidebar;