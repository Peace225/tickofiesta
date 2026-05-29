import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardSidebar from '../../components/layout/DashboardSidebar'; 

export default function DashboardLayout({ sidebar = null }) {
  const { dark } = useSelector((s) => s.theme);

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
  };

  const renderSidebar = () => {
    if (sidebar) {
      return sidebar;
    }
    return <DashboardSidebar />;
  };

  return (
    <div className={`min-h-screen flex ${theme.bg}`}>
      
      {/* --- SIDEBAR DESKTOP --- */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="fixed w-72 h-screen">
          {renderSidebar()}
        </div>
      </div>

      {/* --- MOBILE & CONTENU --- */}
      <div className="flex-1 min-w-0">
        <main className="pb-20 lg:pb-0">
          <Outlet /> 
        </main>
      </div>

      {/* --- BARRE DE NAVIGATION MOBILE (TOUJOURS RENDUE) --- */}
      {/* On la sort de la logique desktop pour s'assurer qu'elle est toujours présente sur mobile */}
      <div className="lg:hidden">
        {renderSidebar()}
      </div>

    </div>
  );
}