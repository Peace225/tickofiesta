import { useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { 
  Settings as SettingsIcon, Globe, Lock, CreditCard, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Settings() {
  const { dark } = useSelector((s) => s.theme);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // Valeurs simulées (À relier à une table 'settings' dans Supabase plus tard)
  const [formData, setFormData] = useState({
    appName: 'TickoFiesta',
    supportEmail: 'contact@tickofiesta.com',
    maintenanceMode: false,
    require2FA: true,
    defaultCurrency: 'XOF (FCFA)',
    baseCommission: 5
  });

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-2xl' : 'bg-white border-indigo-50 shadow-2xl',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-indigo-500' : 'bg-slate-50 border-gray-200 text-slate-900 focus:border-indigo-500',
    tabActive: 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]',
    tabInactive: dark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulation appel API
    setTimeout(() => {
      toast.success('Configuration système sauvegardée');
      setSaving(false);
    }, 1000);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
        
        {/* HEADER PARAMÈTRES */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
              <SettingsIcon size={14} className="text-indigo-400" />
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Configuration</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Paramètres <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Système</span>
            </h1>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className={`flex gap-2 p-1.5 rounded-2xl border w-fit shadow-sm ${dark ? 'bg-[#0A0A12] border-white/5' : 'bg-slate-100 border-gray-200'}`}>
          <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'general' ? theme.tabActive : theme.tabInactive}`}>
            <Globe size={16} /> Général
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'security' ? theme.tabActive : theme.tabInactive}`}>
            <Lock size={16} /> Sécurité
          </button>
          <button onClick={() => setActiveTab('billing')} className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'billing' ? theme.tabActive : theme.tabInactive}`}>
            <CreditCard size={16} /> Facturation
          </button>
        </div>

        {/* CONTENT */}
        <form onSubmit={handleSave} className={`p-8 md:p-10 rounded-[2.5rem] border ${theme.card}`}>
          <div className="max-w-2xl space-y-8">
            
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className={`text-xl font-black tracking-tight ${theme.text}`}>Informations de la plateforme</h2>
                
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Nom de l'application</label>
                  <input type="text" value={formData.appName} onChange={(e) => setFormData({...formData, appName: e.target.value})} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.input}`} />
                </div>
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Email Support / Contact</label>
                  <input type="email" value={formData.supportEmail} onChange={(e) => setFormData({...formData, supportEmail: e.target.value})} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.input}`} />
                </div>

                <div className="pt-4 border-t border-inherit border-opacity-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-sm font-black ${theme.text}`}>Mode Maintenance</h4>
                      <p className={`text-xs mt-1 ${theme.sub}`}>Désactive l'accès public à l'application.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.maintenanceMode} onChange={() => setFormData({...formData, maintenanceMode: !formData.maintenanceMode})} />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className={`text-xl font-black tracking-tight ${theme.text}`}>Politique de Sécurité</h2>
                
                <div className="flex items-center justify-between p-6 rounded-2xl border border-inherit border-opacity-10 bg-black/5 dark:bg-white/5">
                  <div>
                    <h4 className={`text-sm font-black ${theme.text}`}>Authentification Double Facteur (2FA)</h4>
                    <p className={`text-xs mt-1 ${theme.sub}`}>Obliger les organisateurs à utiliser le 2FA.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.require2FA} onChange={() => setFormData({...formData, require2FA: !formData.require2FA})} />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className={`text-xl font-black tracking-tight ${theme.text}`}>Paramètres Financiers</h2>
                
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Devise par défaut</label>
                  <input type="text" disabled value={formData.defaultCurrency} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-bold opacity-50 cursor-not-allowed ${theme.input}`} />
                </div>
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-[0.1em] ${theme.sub}`}>Taux de commission de base (%)</label>
                  <input type="number" value={formData.baseCommission} onChange={(e) => setFormData({...formData, baseCommission: e.target.value})} className={`w-full mt-2 px-5 py-4 rounded-xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.input}`} />
                </div>
              </div>
            )}

            {/* ACTION BUTTON */}
            <div className="pt-8 mt-8 border-t border-inherit border-opacity-10">
              <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50">
                {saving ? <Spinner size="sm" className="border-white" /> : <><Save size={16} /> Appliquer les modifications</>}
              </button>
            </div>

          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}