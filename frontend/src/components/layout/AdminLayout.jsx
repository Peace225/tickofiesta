import { Outlet } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      {/* Le composant <Outlet /> est magique : 
        C'est la fenêtre où React va injecter tes différentes pages 
        (Commissions, Scanner, etc.) sans jamais recharger la Sidebar !
      */}
      <Outlet />
    </DashboardLayout>
  );
}