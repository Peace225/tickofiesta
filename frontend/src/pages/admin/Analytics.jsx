import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import {
  BarChart3, TrendingUp, Users, Eye, Calendar,
  DollarSign, Activity, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Analytics() {
  const { dark } = useSelector((s) => s.theme);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dateRange, setDateRange] = useState('7');
  const [isLive, setIsLive] = useState(false);
  
  const [stats, setStats] = useState({
    pageViews: 0,
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    topEvents: [],
    chartData: [] // Données unifiées pour les graphiques
  });

  const debounceTimer = useRef(null);

  // Palette Premium / Data Center
  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20',
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA');
  };

  // ✅ LOGIQUE OPTIMISÉE : 1 seule passe, 0 boucle SQL
  const loadAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsUpdating(true);

    try {
      const daysToFetch = dateRange === 'all' ? 30 : parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToFetch);
      const startIso = startDate.toISOString();

      // 1. REQUÊTES PARALLÈLES GLOBALES (Totaux absolus)
      const [
        { count: totalViews }, { count: totalUsers }, { count: totalEvents },
        { data: allPurchases }, { data: topEvents }
      ] = await Promise.all([
        supabase.from('page_views').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('statut', 'validé'),
        supabase.from('purchases').select('montant').eq('status', 'completed'),
        supabase.from('events').select('id, titre, image, views').eq('statut', 'validé').order('views', { ascending: false }).limit(5)
      ]);

      const globalRevenue = allPurchases?.reduce((acc, p) => acc + (p.montant || 0), 0) || 0;

      // 2. REQUÊTES POUR LES GRAPHIQUES (Seulement la période sélectionnée)
      const [viewsRes, usersRes, purchasesRes] = await Promise.all([
        supabase.from('page_views').select('created_at').gte('created_at', startIso),
        supabase.from('profiles').select('created_at').gte('created_at', startIso),
        supabase.from('purchases').select('montant, created_at').eq('status', 'completed').gte('created_at', startIso)
      ]);

      // 3. AGRÉGATION ULTRA-RAPIDE EN JAVASCRIPT
      const chartMap = {};
      
      // Initialiser les jours vides pour éviter les trous dans le graphique
      for (let i = daysToFetch - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];
        chartMap[isoDate] = { 
          date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), 
          views: 0, users: 0, revenue: 0 
        };
      }

      // Remplissage
      viewsRes.data?.forEach(v => {
        const d = v.created_at.split('T')[0];
        if (chartMap[d]) chartMap[d].views++;
      });
      usersRes.data?.forEach(u => {
        const d = u.created_at.split('T')[0];
        if (chartMap[d]) chartMap[d].users++;
      });
      purchasesRes.data?.forEach(p => {
        const d = p.created_at.split('T')[0];
        if (chartMap[d]) chartMap[d].revenue += (p.montant || 0);
      });

      setStats({
        pageViews: totalViews || 0,
        totalUsers: totalUsers || 0,
        totalEvents: totalEvents || 0,
        totalRevenue: globalRevenue,
        topEvents: topEvents || [],
        chartData: Object.values(chartMap) // Tableau formaté pour Recharts
      });

    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // LOGIQUE TEMPS RÉEL
  useEffect(() => {
    const debouncedRefresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => loadAnalytics(true), 1500); 
    };

    const channel = supabase.channel('realtime_analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedRefresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_views' }, debouncedRefresh)
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [loadAnalytics]);

  // Composant Tooltip Customisé pour Recharts
  const CustomTooltip = ({ active, payload, label, isCurrency }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-2xl shadow-2xl border ${dark ? 'bg-[#0A0A12] border-white/10' : 'bg-white border-gray-100'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${theme.sub}`}>{label}</p>
          <p className={`text-xl font-black ${payload[0].stroke || payload[0].fill}`}>
            {isCurrency ? formatCurrency(payload[0].value) : payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
        
        {/* --- HEADER --- */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-transparent to-emerald-500/10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
                <BarChart3 size={14} className="text-indigo-400" />
                <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Data Center</span>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                {isUpdating ? <RefreshCw size={10} className="text-emerald-400 animate-spin" /> : <Activity size={10} className={`${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />}
                <span className={`text-[9px] font-bold tracking-widest uppercase ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>{isUpdating ? "Sync..." : isLive ? "Live" : "Hors Ligne"}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Analyse des <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Performances</span>
            </h1>
          </div>

          <div className="relative z-10 w-full lg:w-64 group">
            <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`w-full pl-12 pr-10 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer shadow-inner ${theme.input}`}
            >
              <option value="7">7 derniers jours</option>
              <option value="15">15 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="all">Historique Complet</option>
            </select>
          </div>
        </div>

        {/* --- KPI --- */}
        {loading ? (
          <div className="flex justify-center items-center py-32"><Spinner size="xl" className="border-indigo-500 border-t-emerald-400" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative">
              {isUpdating && <div className="absolute inset-0 z-50 bg-black/5 dark:bg-white/5 backdrop-blur-[1px] rounded-[2rem] transition-all" />}
              {[
                { label: 'Vues de Pages', value: stats.pageViews.toLocaleString(), icon: Eye, color: '#6366f1' },
                { label: 'Utilisateurs', value: stats.totalUsers.toLocaleString(), icon: Users, color: '#10b981' },
                { label: 'Événements Actifs', value: stats.totalEvents.toLocaleString(), icon: Calendar, color: '#f5a623' },
                { label: 'Revenus Globaux', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: '#f43f5e' },
              ].map((stat, idx) => (
                <div key={idx} className={`group p-6 rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 hover:border-white/10 ${theme.card}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    <stat.icon size={20} strokeWidth={2} />
                  </div>
                  <p className={`text-3xl font-black tracking-tighter ${theme.text}`}>{stat.value}</p>
                  <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${theme.sub}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* --- CHARTS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Trafic (AreaChart) */}
              <div className={`p-8 rounded-[2rem] border flex flex-col ${theme.card}`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-lg font-black tracking-tight ${theme.text}`}>Trafic de la plateforme</h3>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center"><Eye size={14} className="text-indigo-500" /></div>
                </div>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? '#ffffff05' : '#00000005'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' }} dy={10} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenus (BarChart) */}
              <div className={`p-8 rounded-[2rem] border flex flex-col ${theme.card}`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-lg font-black tracking-tight ${theme.text}`}>Croissance des Revenus</h3>
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center"><TrendingUp size={14} className="text-rose-500" /></div>
                </div>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? '#ffffff05' : '#00000005'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' }} dy={10} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip isCurrency />} />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {stats.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="url(#colorRev)" className="hover:opacity-80 transition-opacity cursor-pointer" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* --- TOP EVENTS --- */}
            <div className={`p-8 rounded-[2rem] border ${theme.card}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"><Activity size={16} className="text-amber-500" /></div>
                <h3 className={`text-xl font-black tracking-tight ${theme.text}`}>Palmarès des Événements</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.topEvents.length === 0 ? (
                  <p className={`col-span-full text-center py-8 ${theme.sub}`}>Aucun événement actif pour le moment.</p>
                ) : (
                  stats.topEvents.map((event, idx) => (
                    <div key={event.id} className={`group relative overflow-hidden rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dark ? 'bg-white/5 border-white/10 hover:border-amber-500/30' : 'bg-slate-50 border-slate-200 hover:border-amber-500/30'}`}>
                      <div className="h-24 w-full overflow-hidden relative">
                        <img src={event.image || '/placeholder.jpg'} alt={event.titre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <p className="text-white text-xs font-black truncate">{event.titre}</p>
                        </div>
                        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 text-black text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg">#{idx + 1}</div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Total Vues</span>
                        <span className={`text-sm font-black text-amber-500`}>{event.views?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}