import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, lazy, Suspense, memo, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';

import { getMe, loginSuccess, forceLogout } from './store/slices/authSlice';
import { supabase } from './config/supabaseClient';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import WhatsAppButton from './components/home/WhatsAppButton';

// ✅ Lazy loading
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const VotesPage = lazy(() => import('./pages/VotesPage'));
const VoteDetailPage = lazy(() => import('./pages/VoteDetailPage'));
const OrganisateursPage = lazy(() => import('./pages/OrganisateursPage'));
const OrganisateurProfilePage = lazy(() => import('./pages/OrganisateurProfilePage'));
const PolitiquePage = lazy(() => import('./pages/PolitiquePage'));
const Tarifs = lazy(() => import('./pages/Tarifs'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Community = lazy(() => import('./pages/Community'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Favorites = lazy(() => import('./pages/Favorites'));
const MesBilletsPage = lazy(() => import('./pages/MesBilletsPage'));
const ClientVotes = lazy(() => import('./pages/client/ClientVotes'));
const ClientTransactions = lazy(() => import('./pages/client/ClientTransactions'));
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'));
const OrgDashboard = lazy(() => import('./pages/dashboard/OrgDashboard'));
const OrgEventsPage = lazy(() => import('./pages/dashboard/OrgEventsPage'));
const OrgEventCreatePage = lazy(() => import('./pages/dashboard/OrgEventCreatePage'));
const OrgStatsPage = lazy(() => import('./pages/dashboard/OrgStatsPage'));
const OrgTicketsPage = lazy(() => import('./pages/dashboard/OrgTicketsPage'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const OrgVotesPage = lazy(() => import('./pages/dashboard/OrgVotesPage'));
const OrgVoteCreatePage = lazy(() => import('./pages/dashboard/OrgVoteCreatePage'));
const OrgCandidatCreatePage = lazy(() => import('./pages/dashboard/OrgCandidatCreatePage'));
const OrgVoteEdit = lazy(() => import('./pages/dashboard/OrgVoteEdit'));
const OrgSettingsPage = lazy(() => import('./pages/dashboard/OrgSettingsPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Validations = lazy(() => import('./pages/admin/Validations'));
const Users = lazy(() => import('./pages/admin/Users'));
const Commissions = lazy(() => import('./pages/admin/Commissions'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Publicites = lazy(() => import('./pages/admin/Publicites'));
const Partenaires = lazy(() => import('./pages/admin/Partenaires'));
const SecurityLogs = lazy(() => import('./pages/admin/SecurityLogs'));
const QRScanner = lazy(() => import('./pages/admin/QRScanner'));
const Settings = lazy(() => import('./pages/admin/Settings'));

const ScrollToTop = memo(() => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
});

function PageTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) return;

    const track = () => {
      const sessionId = sessionStorage.getItem('bv_session') ||
        'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('bv_session', sessionId);
      supabase.from('page_views').insert([{ page_path: pathname, session_id: sessionId }]).then(()=>{});
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(track, { timeout: 1500 });
    } else {
      setTimeout(track, 300);
    }
  }, [pathname]);
  return null;
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export default function App() {
  const dispatch = useDispatch();
  const { dark } = useSelector((s) => s.theme);
  const { initialized, user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(getMe());
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        dispatch(loginSuccess({
          user: {...session.user, role: session.user.user_metadata?.role || 'client' },
          session
        }));
      } else if (event === 'SIGNED_OUT') {
        dispatch(forceLogout());
      }
    });
    return () => subscription.unsubscribe();
  }, [dispatch]);

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  useEffect(() => {
    if (initialized) {
      const preload = () => {
        import('./pages/HomePage');
        import('./pages/EventsPage');
        import('./pages/LoginPage');
      };
      if ('requestIdleCallback' in window) requestIdleCallback(preload);
      else setTimeout(preload, 2000);
    }
  }, [initialized]);

  const homeRoute = useMemo(() => {
    if (!user) return '/home';
    const role = user.role || user.user_metadata?.role;
    return role === 'admin'? '/admin' : role === 'organisateur'? '/dashboard' : '/events';
  }, [user]);

  if (!initialized) {
    return <div className={`min-h-screen flex items-center justify-center ${dark? 'bg-[#080812]' : 'bg-[#fafafe]'}`}><Spinner size="xl" /></div>;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <PageTracker />
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
      <div className={`min-h-screen flex flex-col ${dark? 'bg-[#080812] text-[#e8e6ff]' : 'bg-[#fafafe] text-gray-900'}`}>
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/login" element={!user? <LoginPage /> : <Navigate to={homeRoute} replace />} />
              <Route path="/register" element={!user? <RegisterPage /> : <Navigate to={homeRoute} replace />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/votes" element={<VotesPage />} />
              <Route path="/votes/:id" element={<VoteDetailPage />} />
              <Route path="/organisateurs" element={<OrganisateursPage />} />
              <Route path="/organisateurs/:id" element={<OrganisateurProfilePage />} />
              <Route path="/politique" element={<PolitiquePage />} />
              <Route path="/tarifs" element={<Tarifs />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="/mes-billets" element={<ProtectedRoute roles={['client']}><MesBilletsPage /></ProtectedRoute>} />
              <Route path="/mes-votes" element={<ProtectedRoute roles={['client']}><ClientVotes /></ProtectedRoute>} />
              <Route path="/mes-transactions" element={<ProtectedRoute roles={['client']}><ClientTransactions /></ProtectedRoute>} />
              <Route path="/mon-profil" element={<ProtectedRoute roles={['client']}><ClientProfile /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute roles={['organisateur','admin']}><OrgDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/events" element={<ProtectedRoute roles={['organisateur','admin']}><OrgEventsPage /></ProtectedRoute>} />
              <Route path="/dashboard/events/create" element={<ProtectedRoute roles={['organisateur','admin']}><OrgEventCreatePage /></ProtectedRoute>} />
              <Route path="/dashboard/stats" element={<ProtectedRoute roles={['organisateur','admin']}><OrgStatsPage /></ProtectedRoute>} />
              <Route path="/dashboard/tickets" element={<ProtectedRoute roles={['organisateur','admin']}><OrgTicketsPage /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute roles={['organisateur','admin']}><OrgSettingsPage /></ProtectedRoute>} />
              <Route path="/dashboard/votes" element={<ProtectedRoute roles={['organisateur','admin']}><OrgVotesPage /></ProtectedRoute>} />
              <Route path="/dashboard/votes/create" element={<ProtectedRoute roles={['organisateur','admin']}><OrgVoteCreatePage /></ProtectedRoute>} />
              <Route path="/dashboard/votes/:voteId/candidats/create" element={<ProtectedRoute roles={['organisateur','admin']}><OrgCandidatCreatePage /></ProtectedRoute>} />
              <Route path="/dashboard/votes/:id/edit" element={<ProtectedRoute roles={['organisateur','admin']}><OrgVoteEdit /></ProtectedRoute>} />
              <Route path="/scanner" element={<ProtectedRoute roles={['admin','organisateur']}><ScannerPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/events" element={<ProtectedRoute roles={['admin']}><Validations /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
              <Route path="/admin/commissions" element={<ProtectedRoute roles={['admin']}><Commissions /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>} />
              <Route path="/admin/publicites" element={<ProtectedRoute roles={['admin']}><Publicites /></ProtectedRoute>} />
              <Route path="/admin/partenaires" element={<ProtectedRoute roles={['admin']}><Partenaires /></ProtectedRoute>} />
              <Route path="/admin/logs" element={<ProtectedRoute roles={['admin']}><SecurityLogs /></ProtectedRoute>} />
              <Route path="/admin/scanner" element={<ProtectedRoute roles={['admin']}><QRScanner /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </BrowserRouter>
  );
}