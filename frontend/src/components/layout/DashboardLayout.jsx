import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { supabase } from '../../config/supabaseClient';
import {
  LayoutDashboard, Calendar, BarChart2, QrCode, Users, CheckSquare,
  Shield, LogOut, Sun, Moon, Menu, X, Ticket, ChevronRight,
  Settings, Zap, Megaphone, Handshake, TrendingUp, Bell, Sparkles
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const meta = user?.user_metadata || {};
  const role = meta.role || user?.role;
  const isAdmin = role === 'admin';
  const userName = meta.nom || user?.email?.split('@')[0] || 'Utilisateur';

  useEffect(() => {
    if (!isAdmin) return;
    const fetchNotifs = async () => {
      try {
        const eventsPromise = supabase
          .from('events')
          .select('id, titre, created_at')
          .eq('statut', 'en_attente')
          .order('created_at', { ascending: false });

        // CORRECTION : Utilisation de 'publicites' au lieu de 'ads'
        const pubsPromise = supabase
          .from('publicites')
          .select('id, titre, created_at')
          .eq('actif', false)
          .then(res => res)
          .catch(() => ({ data: [] }));

        const [eventsRes, pubsRes] = await Promise.all([eventsPromise, pubsPromise]);

        const eventNotifs = (eventsRes.data || []).map(e => ({
          id: e.id,
          type: 'event',
          message: `Événement à valider : ${e.titre}`,
          lien: '/admin/events',
          date: e.created_at,
        }));

        const pubNotifs = (pubsRes.data || []).map(p => ({
          id: p.id,
          type: 'pub',
          message: `Demande de pub : ${p.titre || 'Sans titre'}`,
          lien: '/admin/publicites',
          date: p.created_at,
        }));

        setNotifs([...pubNotifs, ...eventNotifs].sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (e) {
        console.error("Erreur chargement notifs admin", e);
      }
    };
    
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLogout = async () => {
    await dispatch(logoutUser()).unwrap();
    navigate('/login');
  };

  const orgLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/dashboard/events', icon: Calendar, label: 'Mes événements' },
    { to: '/dashboard/stats', icon: BarChart2, label: 'Statistiques' },
    { to: '/scanner', icon: QrCode, label: 'Scanner d\'entrée' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: "Vue d'ensemble", section: null },
    { to: '/admin/events', icon: CheckSquare, label: 'Validation', section: 'Gestion' },
    { to: '/admin/users', icon: Users, label: 'Utilisateurs', section: null },
    { to: '/admin/commissions', icon: Ticket, label: 'Commissions', section: 'Finance' },
    { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics', section: null },
    { to: '/admin/publicites', icon: Megaphone, label: 'Publicités', section: 'Marketing' },
    { to: '/admin/partenaires', icon: Handshake, label: 'Partenaires', section: null },
    { to: '/admin/stats', icon: BarChart2, label: 'Statistiques', section: 'Système' },
    { to: '/admin/logs', icon: Shield, label: 'Logs sécurité', section: null },
    { to: '/scanner', icon: QrCode, label: 'Scanner QR', section: null },
    { to: '/admin/settings', icon: Settings, label: 'Paramètres', section: null },
  ];

  const links = isAdmin ? adminLinks : orgLinks;
  const isActive = (to) => {
    if (to === '/dashboard' || to === '/admin') return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    sidebarBg: dark ? 'bg-[#0f0e1a]' : 'bg-white',
    border: dark ? 'border-[rgba(255,255,255,0.05)]' : 'border-gray-100',
    text: dark ? 'text-white' : 'text-gray-900',
    sub: dark ? 'text-gray-400' : 'text-gray-500',
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full ${theme.sidebarBg} shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
      {/* --- LOGO & ROLE --- */}
      <div className={`px-6 py-6 border-b ${theme.border}`}>
        <Link to="/home" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-[#6c47ff]/20">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-black text-lg tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">
            TICKOFIESTA
          </span>
        </Link>
        <div className={`mt-4 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit border ${dark ? 'bg-[#161527] border-white/5 text-[#8b6bff]' : 'bg-violet-50 border-violet-100 text-violet-600'}`}>
          {isAdmin ? <Shield size={12} /> : <Zap size={12} />}
          {isAdmin ? 'Administration' : 'Espace Pro'}
        </div>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1 custom-scrollbar">
        {links.map(({ to, icon: Icon, label, section }, i) => {
          const prevSection = i > 0 ? links[i - 1].section : null;
          const showSection = section && section !== prevSection;
          return (
            <div key={to}>
              {showSection && (
                <p className={`text-[10px] font-black uppercase tracking-widest px-4 pt-6 pb-2 ${theme.sub} opacity-60`}>
                  {section}
                </p>
              )}
              <Link
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group ${
                  isActive(to)
                    ? 'bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white shadow-lg shadow-[#6c47ff]/25 scale-[1.02]'
                    : `hover:bg-white/5 ${dark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
                }`}
              >
                <Icon size={18} className={`transition-transform duration-300 ${isActive(to) ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="flex-1">{label}</span>
                {isActive(to) && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* --- BOTTOM PROFILE & ACTIONS --- */}
      <div className={`p-4 border-t ${theme.border}`}>

        {/* Notifications (Admin) */}
        {isAdmin && (
          <div className="relative mb-4">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all border ${dark ? 'bg-[#161527] border-white/5 text-gray-300 hover:text-white' : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={16} />
                  {notifs.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />}
                </div>
                Notifications
              </div>
              {notifs.length > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{notifs.length}</span>}
            </button>

            {notifOpen && (
              <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-slide-up ${dark ? 'bg-[#161527] border-white/10' : 'bg-white border-gray-200'}`}>
                <div className={`px-5 py-4 border-b flex items-center justify-between ${theme.border}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Centre de notifs</span>
                  <button onClick={() => setNotifOpen(false)}><X size={14} className={theme.sub} /></button>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {notifs.length === 0 ? (
                    <p className={`text-xs text-center py-6 ${theme.sub}`}>Aucune notification en attente</p>
                  ) : (
                    notifs.map(n => (
                      <Link key={n.id} to={n.lien} onClick={() => setNotifOpen(false)}
                        className={`flex items-start gap-3 px-5 py-4 border-b last:border-0 transition-colors ${dark ? 'border-white/5 hover:bg-white/5' : 'border-gray-50 hover:bg-gray-50'}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'pub' ? 'bg-[#f5a623]/20 text-[#f5a623]' : 'bg-[#6c47ff]/20 text-[#6c47ff]'}`}>
                          {n.type === 'pub' ? <Megaphone size={14} /> : <CheckSquare size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-tight mb-1 ${theme.text}`}>{n.message}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${theme.sub}`}>{new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Card */}
        <div className={`flex items-center gap-3 p-3 rounded-2xl mb-2 border shadow-sm ${dark ? 'bg-[#161527] border-white/5' : 'bg-white border-gray-100'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-inner">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-black truncate ${theme.text}`}>{userName}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${theme.sub}`}>
              {role === 'organisateur' ? 'Pro' : role}
            </p>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => dispatch(toggleTheme())}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors ${dark ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? 'Clair' : 'Sombre'}
          </button>
          <Link
            to="/events"
            className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors ${dark ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
            <Ticket size={14} /> Le Site
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 mt-2 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={14} /> Déconnexion
        </button>

      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${theme.bg}`}>

      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex flex-col w-64 flex-shrink-0 border-r sticky top-0 h-screen overflow-hidden ${theme.border} z-30`}>
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#080812]/80 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex-shrink-0 flex flex-col z-10 animate-slide-right shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile Topbar */}
        <header className={`lg:hidden sticky top-0 z-40 flex items-center justify-between px-6 h-16 border-b backdrop-blur-xl ${dark ? 'bg-[#0f0e1a]/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${dark ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Menu size={18} />
          </button>

          <Link to="/home" className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">
              TICKOFIESTA
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAdmin && notifs.length > 0 && (
              <div className="relative">
                <Bell size={18} className="text-[#f5a623]" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              </div>
            )}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center text-white text-xs font-black">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto relative">
           <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[rgba(108,71,255,0.05)] to-transparent pointer-events-none" />
           <div className="relative z-10 p-6 md:p-8">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}