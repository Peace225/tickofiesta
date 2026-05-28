import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forceLogout } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { supabase } from '../../config/supabaseClient';
import { Menu } from 'lucide-react';

// On importe le menu par défaut, mais on accepte aussi de recevoir une sidebar spécifique en prop
import DashboardSidebar from '../../components/layout/DashboardSidebar'; 

export default function DashboardLayout({ sidebar = null }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const meta = user?.user_metadata || {};
  const userName = meta.nom || user?.email?.split('@')[0] || 'U';

  // --- NOTIFICATIONS ---
  useEffect(() => {
    if (user?.role !== 'admin') return;
  }, [user]);

  const handleLogout = async () => {
    await dispatch(forceLogout());
    navigate('/login');
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    border: dark ? 'border-white/5' : 'border-gray-200',
    sidebarBg: dark ? 'bg-[#0f0e1a]' : 'bg-white',
  };

  // Logique pour choisir quelle sidebar afficher :
  // Si une prop "sidebar" est fournie (ex: ton volet de modération), on l'affiche.
  // Sinon, on met le DashboardSidebar classique.
  const renderSidebar = (onNavigateCallback = null) => {
    if (sidebar) {
      return sidebar;
    }
    return <DashboardSidebar onNavigate={onNavigateCallback} />;
  };

  return (
    <div className={`min-h-screen flex ${theme.bg}`}>
      
      {/* --- DESKTOP --- */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="fixed w-64 h-screen">
          {renderSidebar()}
        </div>
      </div>

      {/* --- MOBILE --- */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72">
            <div className="h-full bg-[#0A0A12]">
              {renderSidebar(() => setSidebarOpen(false))}
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="flex-1 min-w-0">
        <header className={`lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b ${theme.border} ${theme.sidebarBg}`}>
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu size={22} />
          </button>
          <span className="font-black bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
            TICKOFIESTA
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {userName[0].toUpperCase()}
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet /> {/* ← Toutes tes pages s'affichent ici */}
        </main>
      </div>

    </div>
  );
}