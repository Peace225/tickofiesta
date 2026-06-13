import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, lazy, Suspense, memo } from 'react';
import { Toaster } from 'react-hot-toast';

import { getMe, forceLogout } from './store/slices/authSlice';
import { supabase } from './config/supabaseClient';
import { useSeasonalTheme } from './hooks/useSeasonalTheme'; 

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import WhatsAppButton from './components/home/WhatsAppButton';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import ClientLayout from './components/layout/ClientLayout'; 

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
const LeaderboardPage = lazy(() => import('./components/vote/LeaderboardPage'));
const CagnottesPage = lazy(() => import('./pages/CagnottesPage'));
const OrganisateursPage = lazy(() => import('./pages/OrganisateursPage'));
const OrganisateurProfilePage = lazy(() => import('./pages/OrganisateurProfilePage'));
const StandsPage = lazy(() => import('./pages/StandsPage'));
const PaiementPage = lazy(() => import('./pages/PaiementPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const SuccessPayment = lazy(() => import('./pages/SuccessPayment'));

const TarifsPage = lazy(() => import('./pages/Tarifs'));
const CartPage = lazy(() => import('./pages/CartPage'));

// --- NOUVELLES PAGES LÉGALES ---
const ConditionsUtilisation = lazy(() => import('./pages/ConditionsUtilisation'));
const Confidentialite = lazy(() => import('./pages/Confidentialite'));

// --- Pages Protégées Côté Public (Utilisent la Navbar principale) ---
const ClientCommunity = lazy(() => import('./pages/Community'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Notifications = lazy(() => import('./pages/Notifications'));

// --- Dashboard Organisateur ---
const OrgDashboard = lazy(() => import('./pages/dashboard/OrgDashboard'));
const OrgEventsPage = lazy(() => import('./pages/dashboard/OrgEventsPage'));
const OrgEventCreatePage = lazy(() => import('./pages/dashboard/OrgEventCreatePage'));
const OrgTicketsPage = lazy(() => import('./pages/dashboard/OrgTicketsPage'));
const OrgVotesPage = lazy(() => import('./pages/dashboard/OrgVotesPage'));
const OrgVoteCreatePage = lazy(() => import('./pages/dashboard/OrgVoteCreatePage'));
const OrgVoteEdit = lazy(() => import('./pages/dashboard/OrgVoteEdit'));
const OrgCandidatsCreatePage = lazy(() => import('./pages/dashboard/OrgCandidatsCreatePage')); 
const OrgStatsPage = lazy(() => import('./pages/dashboard/OrgStatsPage'));
const OrgSettingsPage = lazy(() => import('./pages/dashboard/OrgSettingsPage'));
const OrgCagnottesPage = lazy(() => import('./pages/dashboard/OrgCagnottesPage'));
const OrgStandsPage = lazy(() => import('./pages/dashboard/OrgStandsPage'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const OrgCommunity = lazy(() => import('./pages/dashboard/Community'));

// --- Admin ---
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
const TicketPage = lazy(() => import('./pages/TicketPage'));

// --- Client (Espace Privé Dashboard) ---
const MesBilletsPage = lazy(() => import('./pages/MesBilletsPage'));
const ClientVotes = lazy(() => import('./pages/client/ClientVotes'));
const ClientTransactions = lazy(() => import('./pages/client/ClientTransactions'));
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'));

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
  const dark = useSelector(state => state.theme?.dark) ?? false;
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${dark ? 'bg-[#080812] text-white' : 'bg-[#fafafe] text-gray-900'}`}>
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

// Redirection intelligente selon le rôle - CORRIGÉE POUR L'OTP
const AuthRedirectHandler = ({ children }) => {
  const { user } = useSelector(state => state.auth || {});
  const location = useLocation(); // On a besoin de savoir où se trouve l'utilisateur
  
  if (user) {
    // 🚨 LE PANNEAU STOP : On empêche la redirection si l'organisateur est en train de valider son code OTP sur la page register
    if (location.pathname === '/register' && sessionStorage.getItem('otp_pending') === 'true') {
      return children;
    }

    // CORRECTION CRITIQUE: Vérifier d'abord les metadata, sinon Supabase retourne toujours "authenticated" pour user.role
    const rawRole = user?.user_metadata?.role || 'client';
    const userRole = String(rawRole).toLowerCase();
    
    if (['admin','super_admin','superadmin'].includes(userRole)) {
      return <Navigate to="/admin" replace />;
    }
    
    if (userRole === 'organisateur') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Fallback pour les clients/participants
    return <Navigate to="/client/profile" replace />; 
  }
  
  return children;
};

export default function App() {
  const dispatch = useDispatch();

  useSeasonalTheme();

  useEffect(() => {
    dispatch(getMe());
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event)) {
        dispatch(getMe());
        
        if (event === 'SIGNED_IN' && session?.user) {
          const storedRef = localStorage.getItem('tickofiesta_ref');
          
          if (storedRef) {
            try {
              await supabase.from('referrals').insert([
                { referrer_id: storedRef, referee_id: session.user.id }
              ]);
              localStorage.removeItem('tickofiesta_ref');
            } catch (error) {
              console.error("Erreur lors de la validation du parrainage :", error);
            }
          }
        }
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
          
          {/* 1. ROUTES PUBLIQUES (Sans connexion requise) */}
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
            <Route path="/votes/:slug" element={<VoteDetailPage />} />
            <Route path="/votes/:slug/leaderboard" element={<LeaderboardPage />} />
            <Route path="/cagnottes" element={<CagnottesPage />} />
            <Route path="/stands" element={<StandsPage />} />
            <Route path="/organisateurs" element={<OrganisateursPage />} />
            <Route path="/organisateurs/:id" element={<OrganisateurProfilePage />} />
        
            <Route path="/tarifs" element={<TarifsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/ticket/:id" element={<TicketPage />} />

            {/* NOUVELLES ROUTES POUR GOOGLE CLOUD BRANDING */}
            <Route path="/cgu" element={<ConditionsUtilisation />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
            
            {/* PAGES PROTÉGÉES MAIS QUI UTILISENT LA NAVBAR PRINCIPALE */}
            <Route path="/community" element={<ProtectedRoute><ClientCommunity /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          </Route>

          {/* 2. ESPACE CLIENT (Tableau de bord de l'utilisateur avec le système de parrainage) */}
          <Route path="/client" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
            <Route path="profile" element={<ClientProfile />} />
            <Route path="billets" element={<MesBilletsPage />} />
            <Route path="votes" element={<ClientVotes />} />
            <Route path="transactions" element={<ClientTransactions />} />
          </Route>

          {/* 3. ESPACE ORGANISATEUR */}
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
            <Route path="community" element={<OrgCommunity />} />
          </Route>

          {/* 4. ESPACE ADMIN */}
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}