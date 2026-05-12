import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import Spinner from '../../components/ui/Spinner';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import {
  TrendingUp, ShoppingBag, Banknote, Zap, Sparkles, Layout, Activity, RefreshCw, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgDashboard() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [events, setEvents] = useState([]);
  const [revenus, setRevenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  // Formatage monétaire institutionnel (FCFA)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CI', { 
      style: 'currency', 
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
  };

  const loadData = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    else setIsUpdating(true);

    try {
      const [
        { data: eventsData, error: eErr },
        { data: revData, error: rErr }
      ] = await Promise.all([
        supabase.from('events').select('id, titre, statut').eq('organisateur_id', user.id),
        supabase.from('stats_organisateurs').select('*').eq('organisateur_id', user.id)
      ]);

      if (eErr) throw eErr;
      if (rErr) throw rErr;

      setEvents(eventsData || []);

      const merged = revData?.map(stat => ({
        ...stat,
        event: eventsData?.find(e => e.id === stat.event_id)
      })) || [];

      setRevenus(merged);
      setChartKey(prev => prev + 1);
    } catch (err) {
      console.error("Erreur de synchronisation:", err.message);
      if (!silent) toast.error("Échec de la synchronisation des données");
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadData();
    if (!user) return;

    const channel = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `organisateur_id=eq.${user.id}` }, () => loadData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stats_organisateurs', filter: `organisateur_id=eq.${user.id}` }, () => loadData(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const stats = useMemo(() => {
    const totalRev = revenus.reduce((acc, r) => acc + (r.total || 0), 0);
    const totalVentes = revenus.reduce((acc, r) => acc + (r.billets_vendus || 0), 0);
    const totalCom = revenus.reduce((acc, r) => acc + (r.total_commission || 0), 0);
    return { totalRev, totalVentes, gainNet: totalRev - totalCom };
  }, [revenus]);

  const chartData = useMemo(() => revenus.map((r) => ({
    name: r.event?.titre?.substring(0, 15) + '...' || 'Événement',
    revenus: r.total || 0
  })), [revenus]);

  // Palette Ultra-Premium / Institutionnelle
  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark 
      ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' 
      : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    skeleton: dark ? 'bg-white/5' : 'bg-indigo-50',
  }), [dark]);

  if (loading) return (
    <div className={`flex min-h-screen ${theme.bg}`}>
      <DashboardSidebar />
      <main className="flex-1 flex flex-col items-center justify-center">
        <Spinner size="xl" className="border-indigo-500 border-t-amber-400" />
        <p className={`mt-6 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse ${theme.sub}`}>
          Chargement de l'espace Organisateur...
        </p>
      </main>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme.bg}`}>
      <DashboardSidebar />

      <main className="flex-1 min-w-0 overflow-y-auto h-screen relative scroll-smooth custom-scrollbar">
        {/* Glow background subtil */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-10 space-y-8 animate-in fade-in duration-700 pb-32">
          
          {/* --- HEADER ORGANISATEUR --- */}
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-transparent to-emerald-500/10" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="relative z-10 flex gap-6 items-center">
              <div className="hidden md:flex w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-800 p-[1px] shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                 <div className="w-full h-full rounded-2xl bg-[#0A0A12] flex items-center justify-center">
                    <Briefcase size={32} className="text-emerald-400" />
                 </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">
                    <Sparkles size={12} className="text-emerald-400" />
                    <span className="text-emerald-400/90 text-[9px] font-black uppercase tracking-[0.25em]">Espace Organisateur</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${dark ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/20'}`}>
                    {isUpdating ? <RefreshCw size={10} className="text-indigo-400 animate-spin" /> : <Activity size={10} className="text-emerald-400 animate-pulse" />}
                    <span className="text-white/70 text-[9px] font-bold tracking-widest uppercase">{isUpdating ? "Mise à jour..." : "Live Sync"}</span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                  Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{user?.nom || 'Partenaire'}</span>
                </h1>
                <p className="mt-2 text-white/50 text-sm font-medium tracking-wide">
                  Voici l'aperçu financier et opérationnel de vos productions.
                </p>
              </div>
            </div>
          </div>

          {/* --- KPI SECTION --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Productions Actives', value: events.length.toLocaleString(), icon: Layout, color: '#6366f1', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]' },
              { label: 'Billets Écoulés', value: stats.totalVentes.toLocaleString('fr-FR'), icon: ShoppingBag, color: '#10b981', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]' },
              { label: 'Chiffre d\'Affaires Brut', value: formatCurrency(stats.totalRev), icon: TrendingUp, color: '#f5a623', glow: 'shadow-[0_0_30px_rgba(245,166,35,0.15)]' },
              { label: 'Revenus Nets', value: formatCurrency(stats.gainNet), icon: Banknote, color: '#f43f5e', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.15)]' },
            ].map((kpi, idx) => (
              <div key={idx} className={`group relative p-8 rounded-[2rem] border transition-all duration-500 hover:-translate-y-2 hover:border-white/10 ${theme.card} ${kpi.glow}`}>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                    <kpi.icon size={22} strokeWidth={2} />
                  </div>
                </div>
                <p className={`text-4xl font-black tracking-tighter ${theme.text}`}>{kpi.value}</p>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-3 ${theme.sub}`}>{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* --- GRAPHIQUE & FINANCE --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Graphique de performance */}
            <div className={`lg:col-span-2 p-8 rounded-[2rem] border flex flex-col ${theme.card}`}>
              <div className="flex items-center justify-between mb-8">
                 <h3 className={`text-lg font-black tracking-tight ${theme.text}`}>Performance par événement</h3>
              </div>
              
              <div className="w-full h-80 min-h-[320px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer key={chartKey} width="99%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? '#ffffff05' : '#00000005'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b', fontWeight: 700 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        cursor={{ fill: dark ? '#ffffff05' : '#00000005' }}
                        contentStyle={{ backgroundColor: dark ? '#0A0A12' : '#fff', borderRadius: '16px', border: dark ? '1px solid rgba(255,255,255,0.1)' : 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', padding: '12px 20px' }}
                        itemStyle={{ color: dark ? '#fff' : '#000', fontWeight: 900 }}
                        formatter={(value) => [formatCurrency(value), "Revenus"]}
                      />
                      <Bar dataKey="revenus" radius={[8, 8, 0, 0]} barSize={40}>
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill="url(#colorRev)" className="hover:opacity-80 transition-opacity cursor-pointer" />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <TrendingUp size={48} className="mb-4 text-indigo-500" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">En attente de transactions</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analyse Financière Compacte */}
            <div className={`p-8 rounded-[2rem] border flex flex-col justify-between ${theme.card}`}>
              <div className="space-y-8">
                <h3 className={`text-lg font-black tracking-tight ${theme.text}`}>Analyse Financière</h3>
                
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 transition-transform hover:scale-[1.02]">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 ${theme.sub}`}>Ventes Brutes</p>
                    <p className={`text-3xl font-black tracking-tighter ${theme.text}`}>{formatCurrency(stats.totalRev)}</p>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 transition-transform hover:scale-[1.02]">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 ${theme.sub}`}>Revenus Nets Attendus</p>
                    <p className={`text-3xl font-black tracking-tighter text-emerald-500`}>{formatCurrency(stats.gainNet)}</p>
                  </div>
                </div>
              </div>

              <div className={`mt-8 flex items-start gap-4 p-5 rounded-2xl border ${dark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50 border-amber-100'}`}>
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                   <Zap size={14} className="text-amber-500" />
                </div>
                <p className={`text-[11px] font-bold leading-relaxed ${dark ? 'text-amber-500/80' : 'text-amber-800'}`}>
                  Les reversements sont initiés automatiquement <span className="text-amber-500">48h</span> après la clôture officielle de vos événements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}