import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, initialized } = useSelector((state) => state.auth);
  const { dark } = useSelector((state) => state.theme);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className={`flex flex-col gap-4 justify-center items-center min-h-screen ${dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]'}`}>
        <Spinner size="lg" />
        <span className={`text- font-black uppercase tracking-[0.2em] animate-pulse ${dark ? 'text-indigo-500/60' : 'text-indigo-600/60'}`}>
          Sécurisation de la session...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const rawRole = user?.user_metadata?.role || user?.app_metadata?.role || user?.role || 'client';
  const userRole = String(rawRole).toLowerCase();

  if (roles.length > 0) {
    const hasAccess = roles.map(r => r.toLowerCase()).includes(userRole);
    if (!hasAccess) {
      console.warn(`🚫 ACCÈS REFUSÉ: ${location.pathname} - rôle: ${userRole}`);
      const fallback = userRole === 'admin' ? '/admin' : '/events';
      return <Navigate to={fallback} replace />;
    }
  }

  // ✅ CORRECTION : supporte les 2 usages
  return children ? children : <Outlet />;
}