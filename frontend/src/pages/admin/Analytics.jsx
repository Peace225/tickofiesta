import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
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
    pageViews: 0, totalUsers: 0, totalEvents: 0, totalRevenue: 0, topEvents: [], chartData: []
  });

  const debounceTimer = useRef(null);

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20',
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA');

  const loadAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsUpdating(true);
    try {
      const daysToFetch = dateRange === 'all' ? 30 : parseInt(dateRange);
      const startIso = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString();
      const [ { count: v }, { count: u }, { count: e }, { data: p }, { data: te } ] = await Promise.all([
        supabase.from('page_views').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('statut', 'validé'),
        supabase.from('purchases').select('montant').eq('status', 'completed'),
        supabase.from('events').select('id, titre, image, views').eq('statut', 'validé').order('views', { ascending: false }).limit(5)
      ]);
      const [vR, uR, pR] = await Promise.all([
        supabase.from('page_views').select('created_at').gte('created_at', startIso),
        supabase.from('profiles').select('created_at').gte('created_at', startIso),
        supabase.from('purchases').select('montant, created_at').eq('status', 'completed').gte('created_at', startIso)
      ]);
      const chartMap = {};
      for (let i = daysToFetch - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        chartMap[iso] = { date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), views: 0, users: 0, revenue: 0 };
      }
      vR.data?.forEach(x => { const d = x.created_at.split('T')[0]; if (chartMap[d]) chartMap[d].views++; });
      uR.data?.forEach(x => { const d = x.created_at.split('T')[0]; if (chartMap[d]) chartMap[d].users++; });
      pR.data?.forEach(x => { const d = x.created_at.split('T')[0]; if (chartMap[d]) chartMap[d].revenue += (x.montant || 0); });
      setStats({ pageViews: v, totalUsers: u, totalEvents: e, totalRevenue: p?.reduce((a, b) => a + (b.montant || 0), 0) || 0, topEvents: te || [], chartData: Object.values(chartMap) });
    } catch (err) { toast.error('Erreur de chargement'); } finally { setLoading(false); setIsUpdating(false); }
  }, [dateRange]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  return (
    <div className={`min-h-screen ${theme.bg} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-end p-10 rounded-[2rem] bg-[#0A0A12] border border-white/5">
          <h1 className="text-4xl font-black text-white">Analyse des <span className="text-indigo-400">Performances</span></h1>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={`p-4 rounded-2xl border ${theme.input}`}>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
          </select>
        </div>

        {/* CONTENT */}
        {loading ? <div className="flex justify-center"><Spinner size="xl" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-6 rounded-[2rem] border ${theme.card}`}><p className="text-3xl font-black">{stats.pageViews}</p><p className={theme.sub}>Vues</p></div>
            <div className={`p-6 rounded-[2rem] border ${theme.card}`}><p className="text-3xl font-black">{stats.totalUsers}</p><p className={theme.sub}>Utilisateurs</p></div>
            <div className={`p-6 rounded-[2rem] border ${theme.card}`}><p className="text-3xl font-black">{stats.totalEvents}</p><p className={theme.sub}>Événements</p></div>
            <div className={`p-6 rounded-[2rem] border ${theme.card}`}><p className="text-3xl font-black">{formatCurrency(stats.totalRevenue)}</p><p className={theme.sub}>Revenus</p></div>
          </div>
        )}
      </div>
    </div>
  );
}