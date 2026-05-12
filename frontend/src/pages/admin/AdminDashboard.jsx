import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import Spinner from '../../components/ui/Spinner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Users, Calendar, TrendingUp, CheckCircle2,
  Shield, Clock, ShieldAlert, Sparkles, XCircle, Check, Briefcase, Activity, RefreshCw, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const PATH_TO_TAB = {
  '/admin': 'stats',
  '/admin/events': 'events',
  '/admin/users': 'users',
  '/admin/commissions': 'commissions',
  '/admin/partenaires': 'partenaires',
  '/admin/publicites': 'publicites',
  '/admin/analytics': 'analytics',
};

export default function AdminDashboard() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();
  const tab = PATH_TO_TAB[location.pathname] || 'stats';

  // États
  const [stats, setStats] = useState({ totalUsers: 0, totalEvents: 0, totalRevenue: 0 });
  const [chartData, setChartData] = useState([]);
  const [events, setEvents] = useState([]);
  
  // UX & Temps Réel
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const debounceTimer = useRef(null);

  // Palette Ultra-Premium / Institutionnelle
  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark 
      ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' 
      : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  }), [dark]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA');
  };

  // Chargement optimisé avec Promise.all
  const loadGlobalData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsUpdating(true);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const startIso = startDate.toISOString();

      const [usersRes, eventsRes, purchasesRes, pendingEventsRes, recentPurchasesRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('statut', 'validé'),
        supabase.from('purchases').select('montant').eq('status', 'completed'),
        supabase.from('events').select(`*, organisateur:profiles(id, email, nom)`).eq('statut', 'en_attente').order('created_at', { ascending: false }).limit(5),
        supabase.from('purchases').select('montant, created_at').eq('status', 'completed').gte('created_at', startIso)
      ]);

      const totalRev = purchasesRes.data?.reduce((acc, curr) => acc + (curr.montant || 0), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalRevenue: totalRev,
      });

      setEvents(pendingEventsRes.data || []);

      // Construction des données du graphique (7 derniers jours)
      const chartMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        chartMap[d.toISOString().split('T')[0]] = { 
          date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), 
          revenue: 0 
        };
      }

      recentPurchasesRes.data?.forEach(p => {
        const d = p.created_at.split('T')[0];
        if (chartMap[d]) chartMap[d].revenue += (p.montant || 0);
      });

      setChartData(Object.values(chartMap));

    } catch (err) {
      console.error("Erreur de chargement :", err);
      if (!silent) toast.error("Échec de la synchronisation des données");
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, []);

  // WebSockets (Temps Réel)
  useEffect(() => {
    loadGlobalData();

    const debouncedRefresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => loadGlobalData(true), 1500); 
    };

    const channel = supabase.channel('admin_dashboard_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedRefresh)
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [loadGlobalData]);

  // Actions
  const handleUpdateEventStatus = async (id, newStatut) => {
    const loader = toast.loading('Synchronisation...');
    try {
      const { error } = await supabase.from('events').update({ statut: newStatut }).eq('id', id);
      if (error) throw error;
      
      toast.success(`Dossier ${newStatut === 'validé' ? 'approuvé' : 'rejeté'}`, { id: loader });
      setEvents(events.filter(e => e.id !== id));
      if (newStatut === 'validé') setStats(prev => ({ ...prev, totalEvents: prev.totalEvents + 1 }));
    } catch (err) {
      toast.error("Erreur d'exécution", { id: loader });
    }
  };

  const StatusBadge = ({ type }) => {
    const config = {
      en_attente: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,166,35,0.15)]',
      validé: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      rejeté: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    };
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border ${config[type] || 'bg-gray-500/10 text-gray-500'}`}>
        {type === 'en_attente' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
        {type ? type.replace('_', ' ') : 'Inconnu'}
      </span>
    );
  };

  // Tooltip Graphique
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-2xl shadow-2xl border ${dark ? 'bg-[#0A0A12] border-white/10' : 'bg-white border-gray-100'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme.sub}`}>{label}</p>
          <p className={`text-xl font-black text-[#6c47ff]`}>{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading && !stats.totalUsers) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <Spinner size="xl" className="border-[#6c47ff] border-t-[#00d4aa]" />
          <p className={`mt-6 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse ${theme.sub}`}>
            Synchronisation de l'écosystème...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
        
        {/* --- HEADER DIRECTION GÉNÉRALE --- */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 p-6 sm:p-8 md:p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-transparent to-amber-500/10" />
          <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-600/10 rounded-full blur-[100px] sm:blur-[120px] -mr-32 sm:-mr-48 -mt-32 sm:-mt-48 pointer-events-none" />
          
          <div className="relative z-10 flex gap-4 sm:gap-6 items-center">
            <div className="hidden md:flex w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-800 p-[1px] shadow-[0_0_30px_rgba(99,102,241,0.3)]">
               <div className="w-full h-full rounded-2xl bg-[#0A0A12] flex items-center justify-center">
                  <Shield size={32} className="text-amber-400" />
               </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 backdrop-blur-md">
                  <Briefcase size={12} className="text-amber-400" />
                  <span className="text-amber-400/90 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em]">Direction</span>
                </div>
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-full border backdrop-blur-md ${isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                  {isUpdating ? <RefreshCw size={10} className="text-emerald-400 animate-spin" /> : <Activity size={10} className={`${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />}
                  <span className={`text-[8px] sm:text-[9px] font-bold tracking-widest uppercase ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>{isUpdating ? "Sync..." : isLive ? "Live" : "Hors Ligne"}</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">
                Bienvenue, <br className="md:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                  {user?.nom || 'Directeur'}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* --- KPI SECTION --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {isUpdating && <div className="absolute inset-0 z-50 bg-black/5 dark:bg-white/5 backdrop-blur-[1px] rounded-[2rem] transition-all" />}
          {[
            { label: 'Utilisateurs Inscrits', value: stats.totalUsers.toLocaleString(), icon: Users, color: '#6366f1', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]' },
            { label: 'Événements Actifs', value: stats.totalEvents.toLocaleString(), icon: Calendar, color: '#10b981', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]' },
            { label: 'C.A. Global', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: '#f5a623', glow: 'shadow-[0_0_30px_rgba(245,166,35,0.15)]' },
            { label: 'Dossiers à Valider', value: events.length.toLocaleString(), icon: ShieldAlert, color: '#f43f5e', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]' },
          ].map((kpi) => (
            <div key={kpi.label} className={`group relative p-6 sm:p-8 rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 hover:border-white/10 ${theme.card} ${kpi.glow}`}>
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                  <kpi.icon size={20} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2} />
                </div>
                <Sparkles size={14} className="sm:w-4 sm:h-4 text-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <p className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter ${theme.text}`}>{kpi.value}</p>
              <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mt-2 sm:mt-3 ${theme.sub}`}>{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          
          {/* --- GRAPHIQUE D'ACTIVITÉ --- */}
          <div className={`xl:col-span-2 p-6 sm:p-8 rounded-[2rem] border flex flex-col ${theme.card}`}>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${theme.text}`}>Revenus (7 jours)</h3>
              <Link to="/admin/analytics" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#6c47ff] hover:underline flex items-center gap-1">Voir tout <ArrowRight size={12}/></Link>
            </div>
            <div className="w-full h-48 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDashRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c47ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6c47ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? '#ffffff05' : '#00000005'} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' }} dy={10} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#6c47ff" strokeWidth={3} fillOpacity={1} fill="url(#colorDashRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- APPROBATIONS EN ATTENTE (Aperçu) --- */}
          <div className={`p-6 sm:p-8 rounded-[2rem] border flex flex-col ${theme.card}`}>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-2 sm:gap-3 ${theme.text}`}>
                <Clock className="text-amber-500 w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Validations
              </h3>
              <Link to="/admin/events" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 hover:underline">Gérer</Link>
            </div>

            {events.length === 0 ? (
              <div className={`flex flex-col items-center justify-center flex-1 rounded-[1.5rem] border border-dashed transition-colors py-12 sm:py-0 ${dark ? 'border-white/10 bg-white/5' : 'border-indigo-100 bg-indigo-50/50'}`}>
                <CheckCircle2 size={28} className="sm:w-8 sm:h-8 text-emerald-500 mb-3 sm:mb-4 opacity-50" />
                <p className={`text-xs sm:text-sm font-black ${theme.text}`}>Aucun dossier</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1 sm:pr-2">
                {events.map(event => (
                  <div key={event.id} className={`p-3 sm:p-4 rounded-[1.5rem] border ${dark ? 'bg-[#0A0A12] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={event.image || '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs sm:text-sm font-black truncate ${theme.text}`}>{event.titre}</h4>
                        <p className={`text-[9px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 truncate ${theme.sub}`}>{event.organisateur?.nom}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-4">
                      <button onClick={() => handleUpdateEventStatus(event.id, 'validé')} className="flex-1 py-1.5 sm:py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                        Valider
                      </button>
                      <button onClick={() => handleUpdateEventStatus(event.id, 'refusé')} className="flex-1 py-1.5 sm:py-2 rounded-lg bg-rose-500/10 text-rose-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}