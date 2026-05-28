import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, lazy, Suspense, memo } from 'react';
import { Toaster } from 'react-hot-toast';

import { getMe, forceLogout } from './store/slices/authSlice';
import { supabase } from './config/supabaseClient';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import WhatsAppButton from './components/home/WhatsAppButton';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';

// --- Lazy Loading ---
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const VotesPage = lazy(() => import('./pages/VotesPage'));
const VoteDetailPage = lazy(() => import('./pages/VoteDetailPage'));
const CagnottesPage = lazy(() => import('./pages/CagnottesPage'));
const OrganisateursPage = lazy(() => import('./pages/OrganisateursPage'));
const OrganisateurProfilePage = lazy(() => import('./pages/OrganisateurProfilePage'));
const StandsPage = lazy(() => import('./pages/StandsPage'));
const PaiementPage = lazy(() => import('./pages/PaiementPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const SuccessPayment = lazy(() => import('./pages/SuccessPayment'));
const PolitiquePage = lazy(() => import('./pages/PolitiquePage'));
const TarifsPage = lazy(() => import('./pages/Tarifs'));

// Dashboard
const OrgDashboard = lazy(() => import('./pages/dashboard/OrgDashboard'));
const OrgEventsPage = lazy(() => import('./pages/dashboard/OrgEventsPage'));
const OrgEventCreatePage = lazy(() => import('./pages/dashboard/OrgEventCreatePage'));
const OrgTicketsPage = lazy(() => import('./pages/dashboard/OrgTicketsPage'));
const OrgVotesPage = lazy(() => import('./pages/dashboard/OrgVotesPage'));
const OrgVoteCreatePage = lazy(() => import('./pages/dashboard/OrgVoteCreatePage'));
const OrgVoteEdit = lazy(() => import('./pages/dashboard/OrgVoteEdit'));
const OrgCandidatsCreatePage = lazy(() => import('./pages/dashboard/OrgCandidatsCreatePage')); // ← UN SEUL NOM
const OrgStatsPage = lazy(() => import('./pages/dashboard/OrgStatsPage'));
const OrgSettingsPage = lazy(() => import('./pages/dashboard/OrgSettingsPage'));
const OrgCagnottesPage = lazy(() => import('./pages/dashboard/OrgCagnottesPage'));
const OrgStandsPage = lazy(() => import('./pages/dashboard/OrgStandsPage'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));

// Admin
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
const ArchivesPage = lazy(() => import('./pages/admin/ArchivesPage'));

// Client
const Notifications = lazy(() => import('./pages/Notifications'));
const Favorites = lazy(() => import('./pages/Favorites'));
const MesBilletsPage = lazy(() => import('./pages/MesBilletsPage'));
const ClientVotes = lazy(() => import('./pages/client/ClientVotes'));
const ClientTransactions = lazy(() => import('./pages/client/ClientTransactions'));
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'));
const CartPage = lazy(() => import('./pages/CartPage'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
};

const Loading = memo(() => (
  <div className="min-h-screen grid place-items-center bg-[#fafafe] dark:bg-[#080812]">
    <Spinner size="lg" />
  </div>
));

const PublicLayout = () => {
  const dark = useSelector(state => state.theme?.dark)?? false;
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${dark? 'bg-[#080812] text-white' : 'bg-[#fafafe] text-gray-900'}`}>
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

const AuthRedirectHandler = ({ children }) => {
  const { user } = useSelector(state => state.auth || {});
  if (user) {
    const rawRole = user?.role || user?.user_metadata?.role || 'client';
    const userRole = String(rawRole).toLowerCase();
    if (['admin','super_admin','superadmin'].includes(userRole)) return <Navigate to="/admin" replace />;
    if (userRole === 'organisateur') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMe());
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event)) {
        dispatch(getMe());
      }
      if (event === 'SIGNED_OUT') {
        dispatch(forceLogout());
      }
    });
    return () => subscription?.unsubscribe();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* PUBLIC */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthRedirectHandler><LoginPage /></AuthRedirectHandler>} />
            <Route path="/register" element={<AuthRedirectHandler><RegisterPage /></AuthRedirectHandler>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/paiement" element={<PaiementPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
            <Route path="/payment/success" element={<SuccessPayment />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/votes" element={<VotesPage />} />
            <Route path="/votes/:id" element={<VoteDetailPage />} />
            <Route path="/cagnottes" element={<CagnottesPage />} />
            <Route path="/stands" element={<StandsPage />} />
            <Route path="/organisateurs" element={<OrganisateursPage />} />
            <Route path="/organisateurs/:id" element={<OrganisateurProfilePage />} />
            <Route path="/politique" element={<PolitiquePage />} />
            <Route path="/tarifs" element={<TarifsPage />} />

            {/* --- AJOUTEZ LA ROUTE DU PANIER ICI --- */}
              <Route path="/cart" element={<CartPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/mes-billets" element={<MesBilletsPage />} />
              <Route path="/client/votes" element={<ClientVotes />} />
              <Route path="/client/transactions" element={<ClientTransactions />} />
              <Route path="/client/profile" element={<ClientProfile />} />
            </Route>
          </Route>

          {/* DASHBOARD ORGANISATEUR */}
          <Route path="/dashboard" element={<ProtectedRoute roles={['organisateur']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<OrgDashboard />} />
            <Route path="events" element={<OrgEventsPage />} />
            <Route path="events/create" element={<OrgEventCreatePage />} />
            <Route path="tickets" element={<OrgTicketsPage />} />
            <Route path="votes" element={<OrgVotesPage />} />
            <Route path="votes/create" element={<OrgVoteCreatePage />} />
            <Route path="votes/:id/edit" element={<OrgVoteEdit />} />
            <Route path="votes/:id/candidats/create" element={<OrgCandidatsCreatePage />} />
            <Route path="stats" element={<OrgStatsPage />} />
            <Route path="settings" element={<OrgSettingsPage />} />
            <Route path="scanner" element={<ScannerPage />} />
            <Route path="cagnottes" element={<OrgCagnottesPage />} />
            <Route path="stands" element={<OrgStandsPage />} />
          </Route>

          {/* ADMIN - CORRIGÉ */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin','super_admin','superadmin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<Validations />} />
            <Route path="commissions" element={<Commissions />} />
            <Route path="users" element={<Users />} />
            <Route path="partenaires" element={<Partenaires />} />
            <Route path="publicites" element={<Publicites />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="archives" element={<ArchivesPage />} />
            <Route path="scanner" element={<QRScanner />} />
            <Route path="logs" element={<SecurityLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}