import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { 
  ShieldAlert, Terminal, Activity, Lock, AlertTriangle, 
  CheckCircle2, Search, Filter, RefreshCw
} from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

export default function SecurityLogs() {
  const { dark } = useSelector((s) => s.theme);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState('');

  // Simulation de logs ultra-réalistes (À remplacer par un appel Supabase plus tard)
  const [logs] = useState([
    { id: 1, type: 'critical', action: 'Tentative d\'intrusion bloquée', user: 'IP Inconnue', location: 'Moscou, RU', time: 'Il y a 2 min' },
    { id: 2, type: 'success', action: 'Connexion Super Admin', user: 'bradfalk@tickofiesta.com', location: 'Abidjan, CI', time: 'Il y a 14 min' },
    { id: 3, type: 'warning', action: 'Modification des rôles', user: 'bradfalk@tickofiesta.com', target: 'ID: 492-A', time: 'Il y a 1h' },
    { id: 4, type: 'success', action: 'Export CSV Trésorerie', user: 'bradfalk@tickofiesta.com', location: 'Abidjan, CI', time: 'Il y a 3h' },
    { id: 5, type: 'critical', action: 'Échec authentification (x5)', user: 'admin@tickofiesta.com', location: 'Paris, FR', time: 'Il y a 5h' },
  ]);

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-2xl' : 'bg-white border-indigo-50 shadow-2xl',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    terminal: dark ? 'bg-[#05050A] border-white/10 text-emerald-400' : 'bg-slate-900 border-slate-800 text-emerald-400',
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 800); // Simulation de chargement
  }, []);

  const getLogStyle = (type) => {
    switch(type) {
      case 'critical': return 'border-rose-500/30 bg-rose-500/5 text-rose-500';
      case 'warning': return 'border-amber-500/30 bg-amber-500/5 text-amber-500';
      case 'success': return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500';
      default: return 'border-slate-500/30 bg-slate-500/5 text-slate-500';
    }
  };

  const getLogIcon = (type) => {
    switch(type) {
      case 'critical': return <AlertTriangle size={16} />;
      case 'warning': return <ShieldAlert size={16} />;
      case 'success': return <CheckCircle2 size={16} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
        
        {/* HEADER SÉCURITÉ */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-indigo-500/10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
                <Lock size={14} className="text-rose-400" />
                <span className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em]">Pôle Sécurité</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md">
                <Activity size={10} className="text-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-400">Surveillance Active</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Journaux <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400">Système</span>
            </h1>
            <p className="text-white/50 text-sm font-medium tracking-wide">Surveillance en temps réel de l'infrastructure TickoFiesta.</p>
          </div>
        </div>

        {/* FILTRES & RECHERCHE */}
        <div className="flex flex-col md:flex-row gap-4 relative z-20">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
            <input type="text" placeholder="Rechercher une adresse IP, un email, une action..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-12 pr-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.card}`} />
          </div>
          <button className={`flex items-center gap-2 px-8 py-4 rounded-2xl border transition-all ${theme.card} hover:border-rose-500/50`}>
            <Filter size={16} className={theme.sub} />
            <span className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>Filtrer</span>
          </button>
        </div>

        {/* TERMINAL LOGS */}
        {loading ? (
          <div className="flex justify-center items-center py-32"><Spinner size="xl" className="border-rose-500 border-t-indigo-400" /></div>
        ) : (
          <div className={`rounded-[2rem] border overflow-hidden ${theme.terminal} shadow-[0_0_40px_rgba(0,0,0,0.5)]`}>
            
            {/* Terminal Header */}
            <div className="bg-[#05050A] border-b border-white/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-slate-500" />
                <span className="text-xs font-mono text-slate-500">root@tickofiesta-sys:/var/log/auth$</span>
              </div>
              <button onClick={() => setIsUpdating(true)} className="text-slate-500 hover:text-white transition-colors">
                <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Logs List */}
            <div className="p-6 space-y-3 font-mono text-xs md:text-sm h-[500px] overflow-y-auto custom-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border ${getLogStyle(log.type)} transition-colors hover:bg-opacity-20`}>
                  <div className="flex items-center gap-3 w-48 shrink-0">
                    {getLogIcon(log.type)}
                    <span className="font-bold opacity-80">{log.time}</span>
                  </div>
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-6 min-w-0">
                    <span className="font-black truncate">{log.action}</span>
                    <span className="opacity-70 truncate">[{log.user}]</span>
                    {log.location && <span className="opacity-50 text-[10px] uppercase tracking-widest">{log.location}</span>}
                    {log.target && <span className="opacity-50 text-[10px] uppercase tracking-widest">Cible: {log.target}</span>}
                  </div>
                </div>
              ))}
              <div className="pt-4 flex items-center gap-2 text-slate-500">
                <span className="animate-pulse">_</span> En attente de nouvelles entrées...
              </div>
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}