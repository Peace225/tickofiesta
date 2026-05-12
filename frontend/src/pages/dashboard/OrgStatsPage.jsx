import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient'; 
import api from '../../config/api'; 
import Spinner from '../../components/ui/Spinner';
import DashboardSidebar from '../../components/layout/DashboardSidebar'; // ✅ Ajout de la Sidebar
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { TrendingUp, ShoppingBag, Activity, Wallet, Ticket, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgStatsPage() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  
  const [revenus, setRevenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const { data: events, error: eventsError } = await supabase
         .from('events')
         .select('id, titre')
         .eq('organisateur_id', user.id);

        if (eventsError) throw eventsError;

        if (!events || events.length === 0) {
          setRevenus([]);
          return;
        }

        const eventIds = events.map(e => e.id);

        const { data: purchases, error: purchasesError } = await supabase
         .from('purchases')
         .select('event_id, montant, quantite')
         .in('event_id', eventIds)
         .eq('status', 'completed'); 

        if (purchasesError) throw purchasesError;

        const statsMap = {};
        events.forEach(e => {
          statsMap[e.id] = { event: e, total: 0, billets_vendus: 0 };
        });

        (purchases || []).forEach(p => {
          if (statsMap[p.event_id]) {
            statsMap[p.event_id].total += (p.montant || 0);
            statsMap[p.event_id].billets_vendus += (p.quantite || 1);
          }
        });

        const formattedStats = Object.values(statsMap).filter(s => s.total > 0 || s.billets_vendus > 0);
        setRevenus(formattedStats);

      } catch (err) {
        console.warn("Erreur Supabase, fallback API...", err);
        try {
          const { data } = await api.get('/events/organisateur/stats-revenus');
          setRevenus(data.data || []);
        } catch (apiErr) {
          toast.error("Impossible de charger les statistiques.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const totalRevenus = revenus.reduce((acc, r) => acc + (r.total || 0), 0);
  const totalBillets = revenus.reduce((acc, r) => acc + (r.billets_vendus || 0), 0);
  
  const chartData = revenus.map((r) => ({ 
    name: r.event?.titre?.length > 10 ? r.event.titre.substring(0, 10) + '...' : r.event?.titre, 
    revenus: r.total, 
    billets: r.billets_vendus 
  }));

  // ✅ Ajout de `bg` pour la couleur de fond globale
  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f4f5f7]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0f0e1a]/80 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50',
    gridColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    tooltipBg: dark ? '#161527' : '#ffffff',
    tooltipBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };

  // ✅ Structure modifiée avec la Sidebar incluse pendant le chargement
  if (loading) return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme.bg}`}>
      <DashboardSidebar />
      <div className="flex-1 w-full lg:w-[calc(100%-18rem)] flex flex-col items-center justify-center py-20 md:py-32 gap-3 md:gap-4">
        <Spinner size="lg" />
        <span className={`text-xs md:text-sm font-black uppercase tracking-widest animate-pulse ${theme.sub}`}>Analyse des données...</span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${theme.bg}`}>
      
      {/* ✅ 1. LE MENU DE NAVIGATION (Desktop + Mobile) */}
      <DashboardSidebar />

      {/* ✅ 2. LE CONTENU DE LA PAGE */}
      <div className="flex-1 w-full lg:w-[calc(100%-18rem)] pt-8 pb-24 lg:pb-8 animate-fade-in overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 md:space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 md:gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-[#6c47ff]/10 to-[#00d4aa]/10 border border-[#6c47ff]/20 rounded-full px-3 py-1 md:px-4 md:py-1.5 mb-2 md:mb-4">
                <Activity size={12} className="text-[#6c47ff] md:w-4 md:h-4" /> {/* ✅ Classes corrigées */}
                <span className="text-[#6c47ff] text-[10px] md:text-xs font-black uppercase tracking-widest">Dashboard Analytics</span>
              </div>
              <h1 className={`text-3xl md:text-5xl font-black tracking-tighter mb-1 md:mb-2 ${theme.text}`}>
                Statistiques & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">Revenus</span>
              </h1>
              <p className={`text-sm font-medium ${theme.sub}`}>
                Performance temps réel de vos événements
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Revenus */}
            <div className={`group relative overflow-hidden rounded-2xl md:rounded-3xl p-5 md:p-8 border ${theme.card} hover:scale-[1.02] transition-transform duration-300`}> {/* ✅ Classes corrigées */}
              <div className="absolute -top-16 -right-16 md:-top-24 md:-right-24 w-32 h-32 md:w-48 md:h-48 bg-[#6c47ff] rounded-full blur-2xl md:blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#6c47ff] to-[#8b6bff] flex items-center justify-center shadow-lg shadow-[#6c47ff]/30">
                    <Wallet size={20} className="text-white md:w-6 md:h-6" />
                  </div>
                  <ArrowUpRight size={16} className="text-[#6c47ff] md:w-5 md:h-5" />
                </div>
                <p className={`text-xs md:text-sm font-black uppercase tracking-widest mb-1 ${theme.sub}`}>Chiffre d'Affaires</p>
                <p className={`text-3xl md:text-5xl font-black tracking-tighter ${theme.text}`}>
                  {totalRevenus.toLocaleString('fr-FR')}
                  <span className="text-lg md:text-2xl text-[#6c47ff] ml-1">FCFA</span>
                </p>
              </div>
            </div>

            {/* Billets */}
            <div className={`group relative overflow-hidden rounded-2xl md:rounded-3xl p-5 md:p-8 border ${theme.card} hover:scale-[1.02] transition-transform duration-300`}>
              <div className="absolute -top-16 -right-16 md:-top-24 md:-right-24 w-32 h-32 md:w-48 md:h-48 bg-[#00d4aa] rounded-full blur-2xl md:blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#00d4aa] to-[#009e7f] flex items-center justify-center shadow-lg shadow-[#00d4aa]/30">
                    <Ticket size={20} className="text-white md:w-6 md:h-6" />
                  </div>
                  <ArrowUpRight size={16} className="text-[#00d4aa] md:w-5 md:h-5" />
                </div>
                <p className={`text-xs md:text-sm font-black uppercase tracking-widest mb-1 ${theme.sub}`}>Billets Vendus</p>
                <p className={`text-3xl md:text-5xl font-black tracking-tighter ${theme.text}`}>
                  {totalBillets.toLocaleString('fr-FR')}
                  <span className="text-lg md:text-2xl text-[#00d4aa] ml-1">unités</span>
                </p>
              </div>
            </div>
          </div>

          {/* Charts */}
          {chartData.length === 0 ? (
            <div className={`text-center py-16 md:py-20 rounded-3xl md:rounded-[2rem] border-2 border-dashed ${dark ? 'border-white/10 bg-[#0f0e1a]/50' : 'border-gray-200 bg-gray-50'}`}>
              <TrendingUp size={40} className={`mx-auto mb-3 md:mb-4 opacity-20 md:w-12 md:h-12 ${theme.sub}`} />
              <p className={`text-lg md:text-xl font-black mb-1.5 md:mb-2 ${theme.text}`}>Aucune vente enregistrée</p>
              <p className={`text-xs md:text-sm ${theme.sub}`}>Les graphiques apparaîtront après votre première vente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-8">
              
              {/* Chart Revenus */}
              <div className={`rounded-2xl md:rounded-3xl p-4 md:p-8 border ${theme.card}`}>
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div>
                    <h3 className={`text-base md:text-lg font-black tracking-tight ${theme.text}`}>Revenus par événement</h3>
                    <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5 md:mt-1 ${theme.sub}`}>En FCFA</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#6c47ff]/10 flex items-center justify-center">
                    <TrendingUp size={16} className="text-[#6c47ff] md:w-5 md:h-5" />
                  </div>
                </div>
                
                {/* ✅ Classes hauteurs corrigées (h-64 md:h-80) */}
                <div className="h-64 md:h-80 w-full"> 
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6c47ff" stopOpacity={1}/>
                          <stop offset="95%" stopColor="#8b6bff" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.gridColor} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: dark ? '#8b87b8' : '#6b7280', fontWeight: 'bold' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: dark ? '#8b87b8' : '#6b7280', fontWeight: 'bold' }} 
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                      />
                      <Tooltip 
                        cursor={{ fill: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ 
                          backgroundColor: theme.tooltipBg, 
                          border: `1px solid ${theme.tooltipBorder}`, 
                          borderRadius: '12px', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          fontSize: '11px'
                        }}
                        itemStyle={{ color: dark ? '#fff' : '#000', fontWeight: '900' }}
                        formatter={(value) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Revenus']}
                      />
                      <Bar dataKey="revenus" fill="url(#colorRevenus)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart Billets */}
              <div className={`rounded-2xl md:rounded-3xl p-4 md:p-8 border ${theme.card}`}>
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div>
                    <h3 className={`text-base md:text-lg font-black tracking-tight ${theme.text}`}>Volume de billets</h3>
                    <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5 md:mt-1 ${theme.sub}`}>Unités vendues</p>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#00d4aa]/10 flex items-center justify-center">
                    <ShoppingBag size={16} className="text-[#00d4aa] md:w-5 md:h-5" />
                  </div>
                </div>

                {/* ✅ Classes hauteurs corrigées */}
                <div className="h-64 md:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBillets" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.gridColor} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: dark ? '#8b87b8' : '#6b7280', fontWeight: 'bold' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: dark ? '#8b87b8' : '#6b7280', fontWeight: 'bold' }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme.tooltipBg, 
                          border: `1px solid ${theme.tooltipBorder}`, 
                          borderRadius: '12px', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          fontSize: '11px'
                        }}
                        itemStyle={{ color: dark ? '#fff' : '#000', fontWeight: '900' }}
                        formatter={(value) => [`${value} billets`, 'Vendues']}
                      />
                      <Area type="monotone" dataKey="billets" stroke="#00d4aa" strokeWidth={3} fillOpacity={1} fill="url(#colorBillets)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}