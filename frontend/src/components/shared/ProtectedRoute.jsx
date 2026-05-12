import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from '../../components/ui/Spinner';

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, initialized } = useSelector((state) => state.auth);
  const { dark } = useSelector((state) => state.theme);
  const location = useLocation();

  // 1. CHARGEMENT : Tant que Supabase n'a pas confirmé l'identité, on affiche le Spinner
  if (!initialized) {
    return (
      <div className={`flex flex-col gap-4 justify-center items-center min-h-screen ${
        dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]'
      }`}>
        <Spinner size="lg" />
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] animate-pulse ${
          dark ? 'text-indigo-500/60' : 'text-indigo-600/60'
        }`}>
          Sécurisation de la session...
        </span>
      </div>
    );
  }

  // 2. NON CONNECTÉ : Redirection vers Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. EXTRACTION DU RÔLE : Multi-sources pour une fiabilité totale
  const rawRole = 
    user?.user_metadata?.role || 
    user?.app_metadata?.role || 
    user?.role || 
    'client';

  const userRole = String(rawRole).toLowerCase();

  // 4. VÉRIFICATION DES AUTORISATIONS
  // Si la route demande des rôles spécifiques (ex: ['admin'])
  if (roles.length > 0) {
    const hasAccess = roles.map(r => r.toLowerCase()).includes(userRole);

    if (!hasAccess) {
      // DEBUG LOG : Très utile pour comprendre pourquoi on est expulsé d'une page
      console.warn(`🚫 ACCÈS REFUSÉ :
        Page: ${location.pathname}
        Rôles autorisés: ${roles.join(', ')}
        Ton rôle détecté: ${userRole}
      `);

      // Redirection intelligente : 
      // Un admin qui se trompe va sur son dashboard, un client vers les événements
      const fallback = userRole === 'admin' ? '/admin' : '/events';
      return <Navigate to={fallback} replace />;
    }
  }

  // 5. ACCÈS ACCORDÉ
  return children;
}