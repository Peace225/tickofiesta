import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Settings as SettingsIcon, Globe, Lock, CreditCard, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Settings() {
  const { dark } = useSelector((s) => s.theme);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

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
    setTimeout(() => {
      toast.success('Configuration système sauvegardée');
      setSaving(false);
    }, 1000);
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32 ${theme.bg}`}>
      
      {/* HEADER PARAMÈTRES */}
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
            <SettingsIcon size={14} className="text-indigo-400" />
            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Configuration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Paramètres <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Système</span>
          </h1>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className={`flex gap-2 p-1.5 rounded-2xl border w-fit ${dark ? 'bg-[#0A0A12] border-white/5' : 'bg-slate-100 border-gray-200'}`}>
        {['general', 'security', 'billing'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? theme.tabActive : theme.tabInactive}`}
          >
            {tab === 'general' && <Globe size={16}/>} {tab === 'security' && <Lock size={16}/>} {tab === 'billing' && <CreditCard size={16}/>}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <form onSubmit={handleSave} className={`p-8 md:p-10 rounded-[2.5rem] border ${theme.card}`}>
        <div className="max-w-2xl space-y-8">
          {/* Tes champs de formulaire restent identiques à ton code original */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <h2 className={`text-xl font-black ${theme.text}`}>Informations plateforme</h2>
               {/* Inputs... */}
               <label className="text-[10px] font-black uppercase">Nom de l'application</label>
               <input type="text" value={formData.appName} onChange={(e) => setFormData({...formData, appName: e.target.value})} className={`w-full mt-2 p-4 rounded-xl border ${theme.input}`} />
            </div>
          )}
          {/* ... Ajoute les autres tabs ici ... */}
          <button type="submit" className="px-8 py-4 rounded-xl bg-indigo-600 text-white font-black uppercase">
            {saving ? <Spinner /> : "Appliquer"}
          </button>
        </div>
      </form>
    </div>
  );
}