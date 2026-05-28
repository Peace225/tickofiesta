import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard, CheckSquare, DollarSign, Users, 
  Handshake, Megaphone, BarChart3, ShieldAlert, 
  QrCode, Settings, LogOut, Shield, X, Archive
} from 'lucide-react';

export default function AdminSidebar({ isMobileOpen, setIsMobileOpen, handleLogout }) {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();

  // --- 1. CONFIGURATION DES LIENS ---
  const mainLinks = useMemo(() => [
    { name: 'Vue Globale', path: '/admin', icon: LayoutDashboard },
    { name: 'Validations', path: '/admin/events', icon: CheckSquare },
    { name: 'Trésorerie', path: '/admin/commissions', icon: DollarSign },
    { name: 'Utilisateurs', path: '/admin/users', icon: Users },
    { name: 'Partenaires', path: '/admin/partenaires', icon: Handshake },
    { name: 'Régie Pub', path: '/admin/publicites', icon: Megaphone },
    { name: 'Data Center', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Archives global', path: '/admin/archives', icon: Archive },
  ], []);

  const systemLinks = useMemo(() => [
    { name: 'Scanner QR', path: '/admin/scanner', icon: QrCode },
    { name: 'Logs Sécurité', path: '/admin/logs', icon: ShieldAlert },
    { name: 'Paramètres', path: '/admin/settings', icon: Settings },
  ], []);

  // --- 2. STYLE DESIGN PREMIUM ---
  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#0A0A12]/95 backdrop-blur-2xl border-white/5' : 'bg-white/95 backdrop-blur-2xl border-indigo-50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    activeLinkDesktop: dark
      ? 'bg-gradient-to-r from-indigo-500/20 to-transparent border-l-4 border-indigo-500 text-indigo-400 shadow-[inset_10px_0_20px_-10px_rgba(99,102,241,0.3)]'
      : 'bg-gradient-to-r from-indigo-500/10 to-transparent border-l-4 border-indigo-600 text-indigo-700',
    inactiveLinkDesktop: dark
      ? 'border-l-4 border-transparent text-slate-400 hover:text-white hover:bg-white/5'
      : 'border-l-4 border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50',
    userCard: dark ? 'bg-[#05050A] border-white/10' : 'bg-slate-50 border-slate-200',
  }), [dark]);

  const isPathActive = (linkPath) => {
    if (linkPath === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(linkPath);
  };

  const renderSidebarLink = (link) => {
    const isActive = isPathActive(link.path);
    return (
      <Link
        key={link.name}
        to={link.path}
        className={`flex items-center gap-4 px-6 py-3.5 rounded-r-2xl text-[12px] font-black uppercase tracking-widest transition-all duration-300 group ${isActive ? theme.activeLinkDesktop : theme.inactiveLinkDesktop}`}
      >
        <link.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'text-indigo-500 scale-110' : 'group-hover:scale-110 group-hover:text-indigo-400'}`} />
        {link.name}
      </Link>
    );
  };

  return (
    <aside className={`w-72 h-screen border-r flex flex-col fixed lg:sticky top-0 left-0 z-50 transition-transform duration-300 ease-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${theme.bg}`}>
      
      {/* Bouton Fermer (Mobile uniquement) */}
      <button 
        onClick={() => setIsMobileOpen(false)} 
        className="lg:hidden absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500 transition-colors z-20"
      >
        <X size={24} />
      </button>

      {/* LOGO AREA */}
      <div className="p-8 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="w-12 h-12 flex-shrink-0 relative z-10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
          <div className="w-full h-full bg-[#0A0A12] rounded-[11px] flex items-center justify-center">
            <Shield size={24} className="text-indigo-400" />
          </div>
        </div>
        <div className="relative z-10 flex flex-col justify-center">
          <span className={`font-black text-2xl tracking-tighter leading-none ${theme.text}`}>TICKOFIESTA</span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-1">Super Admin</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        <div className="py-2 space-y-1">
          <p className={`text-[9px] font-black uppercase tracking-[0.2em] pl-6 mb-4 ${theme.sub}`}>Gestion Opérationnelle</p>
          {mainLinks.map(renderSidebarLink)}
        </div>

        <div className="pt-6 mt-4 border-t border-inherit border-opacity-10 space-y-1">
          <p className={`text-[9px] font-black uppercase tracking-[0.2em] pl-6 mb-4 ${theme.sub}`}>Système & Sécurité</p>
          {systemLinks.map(renderSidebarLink)}
        </div>
      </nav>

      {/* PROFIL & DECONNEXION */}
      <div className="p-6 border-t border-inherit border-opacity-10 bg-inherit">
        <div className={`p-4 rounded-2xl border flex flex-col gap-4 transition-colors duration-300 ${theme.userCard}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
              <Shield size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-black truncate ${theme.text}`}>{user?.nom || 'Direction'}</p>
              <p className={`text-[10px] font-bold tracking-wider truncate ${theme.sub}`}>{user?.email || 'admin@tickofiesta.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white active:scale-95 transition-all duration-300"
          >
            <LogOut size={14} strokeWidth={2.5} /> Quitter le Panel
          </button>
        </div>
      </div>
    </aside>
  );
}