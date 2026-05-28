import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { forceLogout } from '../../store/slices/authSlice';
import LogoTicko from '../../assets/logo1.png';
import {
  LayoutDashboard, CalendarDays, Ticket, PiggyBank,
  Settings, LogOut, TrendingUp, Vote,
  ChevronLeft, ChevronRight, Globe, Store, Sparkles
} from 'lucide-react';

const DashboardSidebar = memo(({ onNavigate }) => {
  const dark = useSelector((s) => s.theme.dark);
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectivelyCollapsed = isCollapsed && !isHovered;

  const links = useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Événements', path: '/dashboard/events', icon: <CalendarDays size={18} /> },
    { name: 'Billetterie', path: '/dashboard/tickets', icon: <Ticket size={18} /> },
    { name: 'Cagnottes', path: '/dashboard/cagnottes', icon: <PiggyBank size={18} /> },
    { name: 'Stands', path: '/dashboard/stands', icon: <Store size={18} />, badge: 'NEW' },
    { name: 'Votes', path: '/dashboard/votes', icon: <Vote size={18} /> },
    { name: 'Stats', path: '/dashboard/stats', icon: <TrendingUp size={18} /> },
    { name: 'Profil', path: '/dashboard/settings', icon: <Settings size={18} /> },
  ], []);

  const handleLogout = useCallback(async () => {
    dispatch(forceLogout());
    navigate('/login');
    try { await supabase.auth.signOut(); } catch {}
  }, [dispatch, navigate]);

  const isActive = useCallback((path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const userName = user?.user_metadata?.nom || user?.email?.split('@')[0] || 'Organisateur';

  // THEME HAUT CONTRASTE
  const theme = {
    aside: dark ? 'bg-[#050507]/95 border-white/10' : 'bg-white/95 border-slate-200',
    text: dark ? 'text-white' : 'text-slate-900',
    subText: dark ? 'text-slate-300' : 'text-slate-600',
    userCard: dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200',
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      {/* La classe hidden lg:flex masque ce composant sur mobile */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden lg:flex flex-col sticky top-0 z-50 h-screen transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-r backdrop-blur-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${effectivelyCollapsed ? 'w-20' : 'w-72'} ${theme.aside}`}
      >
        
        {/* BOUTON TOGGLE */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className={`absolute -right-3.5 top-8 w-7 h-7 rounded-full flex items-center justify-center border shadow-lg z-50 transition-all duration-300 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          } ${dark ? 'bg-[#121222] border-white/20 text-white hover:bg-[#2a2a3a]' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'}`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* LOGO & BRAND */}
        <div className={`p-6 flex items-center transition-all duration-500 ${effectivelyCollapsed ? 'justify-center' : 'gap-4'}`}>
          <Link to="/" className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-white/10 border border-white/20 shadow-lg hover:rotate-3 transition-transform duration-300">
            <img src={LogoTicko} alt="TickoFiesta Logo" className="w-6 h-6 object-contain" />
          </Link>
          
          <div className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-500 ${effectivelyCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
            <span className={`font-black text-lg tracking-tight ${theme.text}`}>TICKOFIESTA</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00d4aa]">
              Espace Pro
            </span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          <Link 
            to="/" 
            onClick={onNavigate} 
            className={`group relative flex items-center transition-all duration-300 ${effectivelyCollapsed ? 'justify-center w-12 h-12 mx-auto rounded-2xl' : 'gap-3 px-4 py-3 rounded-2xl'} ${theme.subText} hover:text-[#6c47ff]`}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-[#6c47ff]/10 rounded-2xl transition-colors duration-300" />
            <Globe size={18} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <span className={`relative z-10 text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-500 ${effectivelyCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
              Retour au site
            </span>
          </Link>

          <div className="my-3 border-t border-slate-300 dark:border-white/10 mx-4" />

          {links.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={onNavigate}
                className={`group relative flex items-center transition-all duration-300 ${
                  effectivelyCollapsed ? 'justify-center w-12 h-12 mx-auto rounded-2xl' : 'gap-3 px-4 py-3 rounded-2xl'
                } ${active ? theme.text : `${theme.subText} hover:${theme.text}`}`}
              >
                {/* Ligne latérale gauche pour marquer l'état actif */}
                {active && !effectivelyCollapsed && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#00d4aa] rounded-r-full" />
                )}

                {/* Background Actif à fort contraste */}
                {active && (
                  <div className={`absolute inset-0 rounded-2xl border ${dark ? 'bg-white/10 border-white/10' : 'bg-[#6c47ff]/10 border-[#6c47ff]/20'}`} />
                )}
                
                {/* Background Hover (Inactif) */}
                {!active && <div className={`absolute inset-0 rounded-2xl transition-colors duration-300 ${dark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`} />}
                
                {/* L'icône prend la couleur de la marque quand elle est active */}
                <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110 text-[#6c47ff]' : 'group-hover:scale-110'}`}>
                  {link.icon}
                </div>
                
                <div className={`relative z-10 flex items-center justify-between whitespace-nowrap overflow-hidden transition-all duration-500 ${effectivelyCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                  <span className={`text-sm tracking-wide ${active ? 'font-black' : 'font-bold'}`}>
                    {link.name}
                  </span>
                  
                  {link.badge && (
                    <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-[#00d4aa] text-black font-black uppercase tracking-widest shadow-sm flex items-center gap-1">
                      <Sparkles size={8} /> {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE & LOGOUT */}
        <div className="p-4 mt-auto mb-4">
          <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 p-2 ${theme.userCard}`}>
            
            <div className={`flex items-center transition-all duration-500 ${effectivelyCollapsed ? 'justify-center' : 'gap-3 px-2 py-1'}`}>
              <div className="w-10 h-10 rounded-2xl bg-[#6c47ff] flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                {userName[0].toUpperCase()}
              </div>
              
              <div className={`whitespace-nowrap overflow-hidden transition-all duration-500 ${effectivelyCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                <p className={`text-sm font-bold truncate ${theme.text}`}>{userName}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>ID: PRO-{user?.id?.substring(0,4) || '0000'}</p>
              </div>
            </div>
            
            <div className={`transition-all duration-500 overflow-hidden ${effectivelyCollapsed ? 'h-0 opacity-0' : 'h-[40px] opacity-100 mt-3'}`}>
              <button 
                onClick={handleLogout} 
                className="w-full h-full flex items-center justify-center gap-2 rounded-xl text-[11px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-300"
              >
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
});

export default DashboardSidebar;