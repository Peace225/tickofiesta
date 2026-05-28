import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
    setTimeout(() => setLoading(false), 800);
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
    <div className={`max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32 ${theme.bg}`}>
      {/* HEADER SÉCURITÉ */}
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-indigo-500/10" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
              <Lock size={14} className="text-rose-400" />
              <span className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em]">Pôle Sécurité</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            Journaux <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400">Système</span>
          </h1>
        </div>
      </div>

      {/* FILTRES */}
      <div className="flex flex-col md:flex-row gap-4 relative z-20">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-12 pr-5 py-4 rounded-2xl border text-sm font-bold ${theme.card}`} />
        </div>
      </div>

      {/* TERMINAL LOGS */}
      {loading ? (
        <div className="flex justify-center items-center py-32"><Spinner size="xl" /></div>
      ) : (
        <div className={`rounded-[2rem] border overflow-hidden ${theme.terminal}`}>
          <div className="bg-[#05050A] border-b border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><Terminal size={16} className="text-slate-500" /> <span className="text-xs font-mono">root@tickofiesta-sys$</span></div>
            <button onClick={() => setIsUpdating(true)}><RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} /></button>
          </div>
          <div className="p-6 space-y-3 font-mono text-xs md:text-sm h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className={`flex flex-col md:flex-row p-4 rounded-xl border ${getLogStyle(log.type)}`}>
                <div className="w-48 shrink-0 flex items-center gap-2">{getLogIcon(log.type)} {log.time}</div>
                <div className="flex-1 font-black">{log.action} <span className="opacity-70 font-normal">[{log.user}]</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}