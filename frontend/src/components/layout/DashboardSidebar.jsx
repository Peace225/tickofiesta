import { memo, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { forceLogout } from '../../store/slices/authSlice';
import LogoTicko from '../../assets/logo1.png';
import { 
  LayoutDashboard, CalendarDays, Ticket, PiggyBank, 
  Settings, LogOut, TrendingUp, Vote, Store, Sparkles, House 
} from 'lucide-react';

const DashboardSidebar = memo(() => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const links = useMemo(() => [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, hint: 'Vue d\'ensemble' },
    { name: 'Événements', path: '/dashboard/events', icon: <CalendarDays size={20} />, hint: 'Gérez vos productions' },
    { name: 'Billetterie', path: '/dashboard/tickets', icon: <Ticket size={20} />, hint: 'Tarifs et accès' },
    { name: 'Cagnottes', path: '/dashboard/cagnottes', icon: <PiggyBank size={20} />, hint: 'Fonds solidaires' },
    { name: 'Stands', path: '/dashboard/stands', icon: <Store size={20} />, hint: 'Exposants & Ventes' },
    { name: 'Votes', path: '/dashboard/votes', icon: <Vote size={20} />, hint: 'Sondages & Awards' },
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
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex flex-col sticky top-0 h-screen w-72 bg-[#0a0a0c] border-r border-white/[0.05] p-6 shadow-2xl">
        <div className="flex flex-col mb-8 px-4">
          <div className="flex items-center gap-3">
            <div className="relative bg-[#121214] p-1.5 rounded-xl border border-white/[0.08]">
              <img src={LogoTicko} alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <h1 className="text-white font-black tracking-[0.2em] text-lg">TICKO</h1>
          </div>
          <div className="mt-3 pl-1">
            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-[0.15em]">Digital Event Manager</p>
          </div>
        </div>
        
        {/* Bouton Accueil/Site Public */}
        <div className="px-4 mb-4">
          <Link to="/" className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600/20 to-transparent border border-violet-500/20 text-white font-bold text-[13px] hover:from-violet-600/40 transition-all">
            <House size={18} className="text-violet-400" /> Retour au site
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map((link) => {
            const active = isActive(link.path);
            return (
              <Link key={link.name} to={link.path} className={`relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${active ? 'bg-[#1a1a1e] border border-white/[0.05]' : 'hover:bg-[#121214]'}`}>
                <div className={active ? 'text-violet-400' : 'text-zinc-600'}>{link.icon}</div>
                <div className="flex flex-col">
                  <span className={`font-bold text-[13px] ${active ? 'text-white' : 'text-zinc-400'}`}>{link.name}</span>
                  <span className={`text-[10px] font-medium ${active ? 'text-violet-500/70' : 'text-zinc-600'}`}>{link.hint}</span>
                </div>
                {active && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-violet-500" />}
              </Link>
            );
          })}
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-zinc-600 hover:text-red-400 font-bold text-xs mt-auto">
          <LogOut size={16} /> DÉCONNEXION
        </button>
      </aside>

      {/* BOTTOM NAV MOBILE */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-[#0a0a0c] border-t border-white/[0.05] h-16 flex justify-around items-center px-2">
        <Link to="/" className="flex flex-col items-center justify-center w-full h-full text-violet-400">
           <House size={20} />
           <span className="text-[9px] font-bold uppercase mt-1">Accueil</span>
        </Link>
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