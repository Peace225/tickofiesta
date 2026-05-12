import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { forceLogout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { 
  Ticket, Zap, CreditCard, User, 
  LogOut, Sparkles, Bell, Globe, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function ClientLayout() {
  const { dark } = useSelector((s) => s.theme);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- LIENS DE NAVIGATION CLIENT (Navigation fluide sur place) ---
  const navLinks = useMemo(() => [
    { name: 'Accueil Site', path: '/client-home', icon: Globe }, // Note le nouveau path ici !
    { name: 'Mes Billets', path: '/mes-billets', icon: Ticket },
    { name: 'Votes Live', path: '/mes-votes', icon: Zap },
    { name: 'Paiements', path: '/mes-transactions', icon: CreditCard },
    { name: 'Mon Profil', path: '/mon-profil', icon: User },
  ], []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch(forceLogout());
      navigate('/login');
    } catch (error) {
      toast.error("Erreur lors de la déconnexion.");
    }
  };

  const isPathActive = (linkPath) => location.pathname.startsWith(linkPath);

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    navBg: 'bg-[#0A0A12] border-white/10',
    navText: 'text-white',
    navSub: 'text-slate-400',
    activeIcon: 'text-[#00d4aa]', 
    inactiveIcon: 'text-slate-400 group-hover:text-white',
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-500 ${theme.bg}`}>
      
      {/* HEADER MOBILE */}
      <header className={`lg:hidden fixed top-0 w-full z-40 border-b flex justify-between items-center px-4 py-3 ${theme.navBg}`}>
        <Link to="/mes-billets" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center shadow-[0_0_15px_rgba(108,71,255,0.4)]">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className={`font-black text-lg tracking-tighter ${theme.navText}`}>TICKOFIESTA</span>
        </Link>
        <button className={`p-2 rounded-full relative ${theme.navSub} hover:text-white transition-colors`}>
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[#0A0A12]"></span>
        </button>
      </header>

      {/* SIDEBAR DESKTOP */}
      <aside className={`hidden lg:flex flex-col sticky top-0 left-0 z-40 border-r transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[88px]' : 'w-72'} ${theme.navBg}`}>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 w-7 h-7 bg-[#2A2A35] border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#6c47ff] hover:border-[#6c47ff] transition-colors shadow-lg z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center shadow-[0_0_20px_rgba(108,71,255,0.4)] flex-shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
              <h1 className={`font-black text-xl tracking-tighter leading-none ${theme.navText}`}>TICKOFIESTA</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00d4aa] mt-1">Espace Client</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-hidden">
          {navLinks.map((link) => {
            const active = isPathActive(link.path);
            return (
              <Link 
                key={link.name} 
                to={link.path}
                title={isCollapsed ? link.name : ""} 
                className={`flex items-center py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 group
                  ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-4'}
                  ${active 
                    ? 'bg-gradient-to-r from-[#6c47ff]/20 to-transparent text-[#00d4aa] border-l-2 border-[#00d4aa]' 
                    : 'text-slate-400 border-l-2 border-transparent hover:bg-white/5 hover:text-white'
                  }`}
              >
                <link.icon size={isCollapsed ? 20 : 18} strokeWidth={active ? 2.5 : 2} className={`flex-shrink-0 ${active ? 'text-[#00d4aa] scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                {!isCollapsed && <span className="whitespace-nowrap animate-in fade-in duration-300">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout} 
            title={isCollapsed ? "Déconnexion" : ""}
            className={`flex items-center justify-center py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all
              ${isCollapsed ? 'w-full px-0' : 'w-full gap-2 px-4'}`}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ZONE CENTRALE (OUTLET) */}
      <main className="flex-1 w-full min-w-0 pt-16 pb-24 lg:pt-0 lg:pb-0 min-h-screen relative overflow-y-auto">
         <Outlet />
      </main>

      {/* BOTTOM NAVIGATION MOBILE */}
      <nav className={`lg:hidden fixed bottom-0 left-0 w-full z-50 border-t pb-safe transition-colors duration-300 ${theme.navBg}`}>
        <div className="flex items-center justify-around px-2 py-2">
          {navLinks.map((link) => {
            const active = isPathActive(link.path);
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                className="relative flex flex-col items-center justify-center w-full py-2 group"
              >
                <div className={`absolute inset-0 m-auto w-12 h-10 rounded-2xl transition-all duration-300 -z-10 ${active ? 'bg-[#00d4aa]/15 scale-100' : 'scale-0 opacity-0'}`} />
                <link.icon 
                  size={22} 
                  strokeWidth={active ? 2.5 : 2} 
                  className={`mb-1 transition-all duration-300 ${active ? `${theme.activeIcon} -translate-y-1` : theme.inactiveIcon}`} 
                />
                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${active ? theme.activeIcon : theme.inactiveIcon}`}>
                  {link.name.split(' ')[0]} 
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}