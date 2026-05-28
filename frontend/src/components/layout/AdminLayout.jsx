import { useState, useEffect, useMemo, Suspense } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { forceLogout } from '../../store/slices/authSlice';
import { Shield, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminSidebar from './AdminSidebar'; 
import Spinner from '../ui/Spinner'; // Ajuste le chemin vers ton Spinner si nécessaire

export default function AdminLayout() {
  const { dark } = useSelector((s) => s.theme);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

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

  const theme = useMemo(() => ({
    text: dark ? 'text-white' : 'text-[#0a0f25]',
  }), [dark]);

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen ${dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]'}`}>
      
      {/* HEADER MOBILE */}
      <div className={`lg:hidden flex items-center justify-between p-4 border-b sticky top-0 z-30 ${dark ? 'bg-[#0A0A12]/90 backdrop-blur-xl border-white/5' : 'bg-white/90 backdrop-blur-xl border-indigo-50'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
             <div className="w-full h-full bg-[#0A0A12] rounded-[7px] flex items-center justify-center">
                <Shield size={16} className="text-indigo-400" />
             </div>
          </div>
          <span className={`font-black text-lg tracking-tighter leading-none ${theme.text}`}>TICKOFIESTA</span>
        </div>
        <button onClick={() => setIsMobileOpen(true)} className={`p-2 rounded-xl border transition-colors ${dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'}`}>
          <Menu size={20} />
        </button>
      </div>

      {/* OVERLAY MOBILE */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* APPEL DE LA SIDEBAR ADMIN NOIRE */}
      <AdminSidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
        handleLogout={handleLogout} 
      />

      {/* ZONE D'AFFICHAGE DU CONTENU (Bouton Utilisateurs, Commissions, etc.) */}
      <main className="flex-1 w-full min-w-0 lg:h-screen lg:overflow-y-auto relative p-6">
        {/* Le Suspense évite la page blanche vide pendant le chargement des sous-pages */}
        <Suspense fallback={<div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>}>
          <Outlet />
        </Suspense>
      </main>

    </div>
  );
}