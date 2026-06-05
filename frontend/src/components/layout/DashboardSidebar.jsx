import { memo, useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { forceLogout } from '../../store/slices/authSlice';
import LogoTicko from '../../assets/logo1.png';
import { 
  LayoutDashboard, CalendarDays, Ticket, PiggyBank, 
  Settings, LogOut, TrendingUp, Vote, Store, Sparkles, House,
  ChevronLeft, ChevronRight, Users // <-- Ajout de Users ici
} from 'lucide-react';

const DashboardSidebar = memo(() => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  
  // ✅ États pour l'intelligence de la sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // ✅ Effet intelligent : Détection automatique de la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      // Si l'écran est plus petit que 1280px (petit PC/Tablette), on réduit la sidebar
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize(); // Vérification au chargement
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // L'état final combiné : elle est réduite SI elle est "collapsed" ET qu'on ne la survole pas
  const effectivelyCollapsed = isCollapsed && !isHovered;

  const links = useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, hint: 'Vue d\'ensemble' },
    { name: 'Événements', path: '/dashboard/events', icon: <CalendarDays size={20} />, hint: 'Gérez vos productions' },
    { name: 'Billetterie', path: '/dashboard/tickets', icon: <Ticket size={20} />, hint: 'Tarifs et accès' },
    { name: 'Cagnottes', path: '/dashboard/cagnottes', icon: <PiggyBank size={20} />, hint: 'Fonds solidaires' },
    { name: 'Stands', path: '/dashboard/stands', icon: <Store size={20} />, hint: 'Exposants & Ventes' },
    { name: 'Votes', path: '/dashboard/votes', icon: <Vote size={20} />, hint: 'Sondages & Awards' },
    // NOUVEAU LIEN AJOUTÉ ICI :
    { name: 'Communauté', path: '/dashboard/community', icon: <Users size={20} />, hint: 'Vos abonnés' },
    { name: 'Stats', path: '/dashboard/stats', icon: <TrendingUp size={20} />, hint: 'Analyse de données' },
    { name: 'Profil', path: '/dashboard/settings', icon: <Settings size={20} />, hint: 'Paramètres compte' },
  ], []);

  const handleLogout = async () => {
    dispatch(forceLogout());
    navigate('/login');
    try { await supabase.auth.signOut(); } catch {}
  };

  const isActive = (path) => path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);

  return (
    <>
      {/* SIDEBAR DESKTOP INTELLIGENTE */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden lg:flex flex-col sticky top-0 h-screen bg-[#0a0a0c] border-r border-white/[0.05] py-6 shadow-2xl transition-all duration-300 ease-in-out relative z-50 ${effectivelyCollapsed ? 'w-[88px]' : 'w-[280px]'}`}
      >
        
        {/* Bouton de bascule manuel */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3.5 top-10 bg-[#121214] border border-white/[0.05] rounded-full p-1.5 text-zinc-400 hover:text-white transition-all z-50 shadow-lg ${isHovered ? 'opacity-100' : 'opacity-0'} lg:opacity-100`}
        >
          {effectivelyCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* LOGO AREA */}
        <div className={`flex items-center mb-8 h-10 ${effectivelyCollapsed ? 'justify-center' : 'px-6'}`}>
          <div className="relative bg-[#121214] p-1.5 rounded-xl border border-white/[0.08] shrink-0 flex items-center justify-center">
            <img src={LogoTicko} alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          
          <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${effectivelyCollapsed ? 'w-0 opacity-0 ml-0' : 'w-[180px] opacity-100 ml-3'}`}>
            <h1 className="text-white font-black tracking-[0.2em] text-lg leading-tight">TICKOFIESTA</h1>
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.15em] mt-0.5">Digital Event Manager</p>
          </div>
        </div>
        
        {/* Bouton Accueil/Site Public */}
        <div className={`mb-6 ${effectivelyCollapsed ? 'px-3' : 'px-5'}`}>
          <Link 
            to="/" 
            title={effectivelyCollapsed ? "Retour au site" : ""} 
            className={`flex items-center h-12 rounded-2xl bg-gradient-to-r from-violet-600/20 to-transparent border border-violet-500/20 text-white hover:from-violet-600/40 transition-all overflow-hidden ${effectivelyCollapsed ? 'justify-center' : 'px-4'}`}
          >
            <House size={18} className="text-violet-400 shrink-0" />
            <span className={`font-bold text-[13px] whitespace-nowrap overflow-hidden transition-all duration-300 ${effectivelyCollapsed ? 'w-0 opacity-0 ml-0' : 'w-full opacity-100 ml-3'}`}>
              Retour au site
            </span>
          </Link>
        </div>

        {/* NAVIGATION LIENS */}
        <nav className={`flex-1 space-y-1.5 overflow-x-hidden ${effectivelyCollapsed ? 'px-3' : 'px-5'}`}>
          {links.map((link) => {
            const active = isActive(link.path);
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                title={effectivelyCollapsed ? link.name : ""} 
                className={`relative flex items-center h-12 rounded-2xl transition-all duration-300 ${effectivelyCollapsed ? 'justify-center' : 'px-4'} ${active ? 'bg-[#1a1a1e] border border-white/[0.05]' : 'hover:bg-[#121214]'}`}
              >
                <div className={`shrink-0 flex items-center justify-center ${active ? 'text-violet-400' : 'text-zinc-600'}`}>
                  {link.icon}
                </div>
                
                <div className={`flex flex-col justify-center whitespace-nowrap overflow-hidden transition-all duration-300 ${effectivelyCollapsed ? 'w-0 opacity-0 ml-0' : 'w-full opacity-100 ml-4'}`}>
                  <span className={`font-bold text-[13px] leading-tight ${active ? 'text-white' : 'text-zinc-400'}`}>{link.name}</span>
                  <span className={`text-[10px] font-medium leading-tight mt-0.5 ${active ? 'text-violet-500/70' : 'text-zinc-600'}`}>{link.hint}</span>
                </div>

                {/* Point de repère violet (Actif) */}
                {active && (
                  <div className={`absolute w-1.5 h-1.5 rounded-full bg-violet-500 transition-all duration-300 ${effectivelyCollapsed ? 'right-2' : 'right-4'}`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* DÉCONNEXION */}
        <div className={`mt-auto pt-4 ${effectivelyCollapsed ? 'px-3' : 'px-5'}`}>
          <button 
            onClick={handleLogout} 
            title={effectivelyCollapsed ? "Déconnexion" : ""} 
            className={`flex items-center h-12 text-zinc-600 hover:text-red-400 transition-colors rounded-2xl hover:bg-red-500/10 w-full overflow-hidden ${effectivelyCollapsed ? 'justify-center' : 'px-4'}`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`font-bold text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ${effectivelyCollapsed ? 'w-0 opacity-0 ml-0' : 'w-full opacity-100 ml-3 text-left'}`}>
              DÉCONNEXION
            </span>
          </button>
        </div>
      </aside>

      {/* BOTTOM NAV MOBILE (Inchangée) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-[#0a0a0c] border-t border-white/[0.05] h-16 flex justify-around items-center px-2">
        <Link to="/" className="flex flex-col items-center justify-center w-full h-full text-violet-400">
           <House size={20} />
           <span className="text-[9px] font-bold uppercase mt-1">Accueil</span>
        </Link>
        {/* Affichage des 4 premiers liens sur mobile pour éviter de surcharger */}
        {links.slice(0, 4).map((link) => {
          const active = isActive(link.path);
          return (
            <Link key={link.name} to={link.path} className={`flex flex-col items-center justify-center w-full h-full ${active ? 'text-violet-400' : 'text-zinc-600'}`}>
              {link.icon}
              <span className="text-[9px] font-bold uppercase mt-1">{link.name.slice(0, 8)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="lg:hidden h-16" />
    </>
  );
});

export default DashboardSidebar;