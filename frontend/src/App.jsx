import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { getMe, loginSuccess, forceLogout } from './store/slices/authSlice';
import { supabase } from './config/supabaseClient';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Spinner from './components/ui/Spinner';

// Pages Publiques
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import VotesPage from './pages/VotesPage';
import VoteDetailPage from './pages/VoteDetailPage';
import OrganisateursPage from './pages/OrganisateursPage';
import OrganisateurProfilePage from './pages/OrganisateurProfilePage';
import PolitiquePage from './pages/PolitiquePage';
import Tarifs from './pages/Tarifs';
import FAQPage from './pages/FAQPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Community from './pages/Community';
import Notifications from './pages/Notifications';
import Favorites from './pages/Favorites';

// ✅ Page des billets (Simple - Sans Sidebar)
import MesBilletsPage from './pages/MesBilletsPage';

// Pages Participant (Client)
import ClientVotes from './pages/client/ClientVotes';
import ClientTransactions from './pages/client/ClientTransactions';
import ClientProfile from './pages/client/ClientProfile';

// Pages Organisateurs
import OrgDashboard from './pages/dashboard/OrgDashboard';
import OrgEventsPage from './pages/dashboard/OrgEventsPage';
import OrgEventCreatePage from './pages/dashboard/OrgEventCreatePage'; 
import OrgStatsPage from './pages/dashboard/OrgStatsPage';
import OrgTicketsPage from './pages/dashboard/OrgTicketsPage';
import ScannerPage from './pages/ScannerPage';
import OrgVotesPage from './pages/dashboard/OrgVotesPage';
import OrgVoteCreatePage from './pages/dashboard/OrgVoteCreatePage';
import OrgCandidatCreatePage from './pages/dashboard/OrgCandidatCreatePage';
import OrgVoteEdit from './pages/dashboard/OrgVoteEdit';
import OrgSettingsPage from './pages/dashboard/OrgSettingsPage';

// Pages Administrateur
import AdminDashboard from './pages/admin/AdminDashboard';
import Validations from './pages/admin/Validations';
import Users from './pages/admin/Users';
import Commissions from './pages/admin/Commissions';
import Analytics from './pages/admin/Analytics';
import Publicites from './pages/admin/Publicites';
import Partenaires from './pages/admin/Partenaires';
import SecurityLogs from './pages/admin/SecurityLogs';
import QRScanner from './pages/admin/QRScanner';
import Settings from './pages/admin/Settings';

// UTILS
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    let sessionId = sessionStorage.getItem('bv_session');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('bv_session', sessionId);
    }
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/mes-')) return;
    
    supabase.from('page_views').insert([{
      page_path: pathname,
      session_id: sessionId
    }]).then(({error}) => {
       if(error && error.code !== '42P01') console.error("Erreur Analytics:", error);
    });
  }, [pathname]);
  return null;
}

export default function App() {
  const dispatch = useDispatch();
  const { dark } = useSelector((s) => s.theme);
  const { initialized } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(getMe());
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const userData = {
          ...session.user,
          role: session.user.user_metadata?.role || 'client',
          nom: session.user.user_metadata?.nom || 'Utilisateur'
        };
        dispatch(loginSuccess({ user: userData, session }));
      } else if (event === 'SIGNED_OUT') {
        dispatch(forceLogout());
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [dispatch]);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  if (!initialized) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-[#080812]' : 'bg-[#fafafe]'}`}>
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <PageTracker />
      <Toaster position="top-right" />

      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${dark ? 'bg-[#080812] text-[#e8e6ff]' : 'bg-[#fafafe] text-gray-900'}`}>
        
        {/* Navbar globale */}
        <Navbar />

        <main className="flex-1 flex flex-col">
          <Routes>
            {/* --- ROUTES PUBLIQUES --- */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
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

            {/* --- FONCTIONNALITÉS CLIENTS (SIMPLE - SANS SIDEBAR) --- */}
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            
            {/* ✅ Pages déplacées ici pour supprimer la sidebar */}
            <Route path="/mes-billets" element={<ProtectedRoute roles={['client']}><MesBilletsPage /></ProtectedRoute>} />
            <Route path="/mes-votes" element={<ProtectedRoute roles={['client']}><ClientVotes /></ProtectedRoute>} />
            <Route path="/mes-transactions" element={<ProtectedRoute roles={['client']}><ClientTransactions /></ProtectedRoute>} />
            <Route path="/mon-profil" element={<ProtectedRoute roles={['client']}><ClientProfile /></ProtectedRoute>} />

            {/* --- ROUTES ORGANISATEURS (GARDENT LEUR DASHBOARD/SIDEBAR) --- */}
            <Route path="/dashboard" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/events" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgEventsPage /></ProtectedRoute>} />
            <Route path="/dashboard/events/create" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgEventCreatePage /></ProtectedRoute>} />
            <Route path="/dashboard/stats" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgStatsPage /></ProtectedRoute>} />
            <Route path="/dashboard/tickets" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgTicketsPage /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgSettingsPage /></ProtectedRoute>} />
            <Route path="/dashboard/votes" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgVotesPage /></ProtectedRoute>} />
            <Route path="/dashboard/votes/create" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgVoteCreatePage /></ProtectedRoute>} />
            <Route path="/dashboard/votes/:voteId/candidats/create" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgCandidatCreatePage /></ProtectedRoute>} />
            <Route path="/dashboard/votes/:id/edit" element={<ProtectedRoute roles={['organisateur', 'admin']}><OrgVoteEdit /></ProtectedRoute>} />
            <Route path="/scanner" element={<ProtectedRoute roles={['admin', 'organisateur']}><ScannerPage /></ProtectedRoute>} />

            {/* --- ROUTES ADMIN --- */}
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
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}