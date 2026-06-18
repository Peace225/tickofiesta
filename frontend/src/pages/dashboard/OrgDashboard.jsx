import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import Spinner from '../../components/ui/Spinner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingBag, Layout, PiggyBank, Store, AlertCircle, Users, Award, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgDashboard() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [events, setEvents] = useState([]);
  const [cagnottes, setCagnottes] = useState([]);
  const [stands, setStands] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  
  // NOUVEAU : On stocke les scores en temps réel { id_candidat: score }
  const [candidatsScores, setCandidatsScores] = useState({});
  
  const [followersCount, setFollowersCount] = useState(0);
  const [billetsVendus, setBilletsVendus] = useState(0);
  const [caTotal, setCaTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [timeFilter, setTimeFilter] = useState('jour'); 

  // --- LOGIQUE DE PERSONNALISATION ---
  const nomOrganisateur = user?.user_metadata?.nom || 'Organisateur';

  const getInitials = (name) => {
    if (!name) return 'O';
    const words = name.split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour et bonne journée de travail";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir, excellente soirée";
  };
  // -----------------------------------

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-CI', {
    style: 'currency', currency: 'XOF', maximumFractionDigits: 0
  }).format(amount || 0).replace('XOF', 'FCFA');

  const loadData = async (showLoading = false) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    
    try {
      // 1. Récupérer les événements et les concours de l'organisateur
      const [evRes, votesRes] = await Promise.all([
        supabase.from('events').select('id').eq('organisateur_id', user.id),
        supabase.from('votes').select('id').eq('organisateur_id', user.id)
      ]);
      
      const eventIds = evRes.data?.map(e => e.id) || [];
      const voteIds = votesRes.data?.map(v => v.id) || [];
      
      setEvents(evRes.data || []);

      // 2. Récupérer la configuration des billets
      let ticketConfigs = [];
      if (eventIds.length > 0) {
        const { data } = await supabase.from('tickets').select('id, prix').in('event_id', eventIds);
        ticketConfigs = data || [];
      }
      const ticketIds = ticketConfigs.map(t => t.id);

      // 3. Charger toutes les données réelles en parallèle
      const [cag, std, followers, soldTicketsData, cData] = await Promise.all([
        supabase.from('cagnottes').select('montant_actuel').eq('organisateur_id', user.id),
        supabase.from('stands').select('id, statut').eq('organisateur_id', user.id),
        supabase.from('abonnements').select('id', { count: 'exact', head: true }).eq('organisateur_id', user.id),
        ticketIds.length > 0 ? supabase.from('user_tickets').select('id, created_at, ticket_type_id').in('ticket_type_id', ticketIds) : Promise.resolve({ data: [] }),
        voteIds.length > 0 ? supabase.from('candidats').select('id, score').in('vote_id', voteIds) : Promise.resolve({ data: [] })
      ]);

      // Calcul des scores pour l'instantanéité
      const scoresMap = {};
      (cData.data || []).forEach(c => { scoresMap[c.id] = c.score || 0; });
      setCandidatsScores(scoresMap);

      // Calcul du Chiffre d'Affaires
      const soldTickets = soldTicketsData.data || [];
      let totalRevenue = 0;
      
      const txFormat = soldTickets.map(st => {
        const tConf = ticketConfigs.find(t => t.id === st.ticket_type_id);
        const price = Number(tConf?.prix || 0);
        totalRevenue += price;
        return { montant: price, created_at: st.created_at };
      });
      
      setCagnottes(cag.data || []);
      setStands(std.data || []);
      setFollowersCount(followers.count || 0);
      setBilletsVendus(soldTickets.length);
      setCaTotal(totalRevenue);
      setTransactions(txFormat);

    } catch (err) {
      console.error(err);
      toast.error("Erreur de synchronisation des données");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { 
    loadData(true); 
    if (!user) return;

    // --- ÉCOUTE TEMPS RÉEL INSTANTANÉE ---
    const channel = supabase.channel('dashboard_org_realtime_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidats' }, (payload) => {
        // MISE À JOUR INSTANTANÉE DES VOTES !
        setCandidatsScores(prev => {
          // Si le candidat appartient à l'organisateur, on met à jour son score direct
          if (prev[payload.new.id] !== undefined) {
            return { ...prev, [payload.new.id]: payload.new.score || 0 };
          }
          return prev;
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_tickets' }, () => loadData(false))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'abonnements' }, () => loadData(false))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cagnottes' }, () => loadData(false))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Calcul du nombre de votes total basé sur la state instantanée
  const votesTotalInstantanes = useMemo(() => {
    return Object.values(candidatsScores).reduce((acc, score) => acc + score, 0);
  }, [candidatsScores]);

  // --- LOGIQUE DU GRAPHIQUE CHRONOLOGIQUE ---
  const chartData = useMemo(() => {
    if (!transactions.length) return [];

    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const groupedData = {};

    sortedTransactions.forEach(tx => {
      const date = new Date(tx.created_at);
      let key = '';

      if (timeFilter === 'jour') {
        key = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      } else if (timeFilter === 'semaine') {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `Sem ${weekNum} (${date.toLocaleDateString('fr-FR', { month: 'short' })})`;
      } else if (timeFilter === 'mois') {
        key = date.toLocaleDateString('fr-FR', { month: 'long', year: '2-digit' });
      }

      if (!groupedData[key]) groupedData[key] = 0;
      groupedData[key] += Number(tx.montant) || 0;
    });

    return Object.entries(groupedData).map(([name, total]) => ({ name, total })).slice(-7); 
  }, [transactions, timeFilter]);

  const stats = useMemo(() => ({
    abonnes: followersCount,
    events: events.length,
    votes: votesTotalInstantanes, // Branchement direct sur la donnée instantanée
    ventes: billetsVendus,
    ca: caTotal,
    cagnottes: cagnottes.reduce((a, c) => a + (c.montant_actuel || 0), 0),
    standsDispo: stands.filter(s => s.statut === 'disponible').length,
    standsTotal: stands.length
  }), [followersCount, events, votesTotalInstantanes, billetsVendus, caTotal, cagnottes, stands]);

  const theme = {
    bg: dark ? 'bg-[#050507]' : 'bg-[#f8f9ff]',
    card: dark ? 'bg-[#0f0e1a] border-white/5 shadow-2xl shadow-black/10' : 'bg-white border-zinc-100 shadow-xl shadow-zinc-200/40',
    text: dark ? 'text-white' : 'text-zinc-900',
    sub: dark ? 'text-zinc-400' : 'text-zinc-500',
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className={`min-h-screen ${theme.bg} p-4 lg:p-8 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-tr from-[#6c47ff] to-[#8b5cf6] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-[#6c47ff]/30 shrink-0">
              {getInitials(nomOrganisateur)}
            </div>
            <div>
              <h1 className={`text-3xl font-black tracking-tight ${theme.text}`}>Espace de {nomOrganisateur}</h1>
              <p className={`${theme.sub} mt-1 font-medium flex items-center gap-2`}>
                {getGreeting()} <span className="animate-wave origin-bottom-right inline-block">👋</span>
              </p>
            </div>
          </div>

          {stats.standsDispo > 0 && (
             <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/10 text-amber-500 font-bold text-sm border border-amber-500/20 animate-pulse shadow-lg shadow-amber-500/5">
               <AlertCircle size={18} /> {stats.standsDispo} stands disponibles
             </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {[
            { label: 'Abonnés', value: stats.abonnes, icon: Users, color: 'text-[#e65c00]' },
            { label: 'Événements', value: stats.events, icon: Layout, color: 'text-blue-500' },
            { label: 'Billets', value: stats.ventes, icon: ShoppingBag, color: 'text-emerald-500' },
            { label: 'Votes', value: stats.votes, icon: Award, color: 'text-pink-500' }, // Se met à jour instantanément
            { label: "CA Total", value: formatCurrency(stats.ca), icon: TrendingUp, color: 'text-violet-500' },
            { label: 'Cagnottes', value: formatCurrency(stats.cagnottes), icon: PiggyBank, color: 'text-amber-500' },
            { label: 'Stands', value: `${stats.standsTotal - stats.standsDispo}/${stats.standsTotal}`, icon: Store, color: 'text-rose-500' },
          ].map((k, i) => (
            <div key={i} className={`p-5 rounded-3xl border ${theme.card} transition-all hover:scale-[1.02] hover:border-violet-500/30 flex flex-col justify-between`}>
              <div className={`mb-3 ${k.color}`}><k.icon size={24} strokeWidth={2.5} /></div>
              <div>
                <p className={`text-2xl font-black ${theme.text}`}>
                  {k.value}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.sub}`}>{k.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Graphique d'évolution Temporelle */}
        <div className={`p-6 lg:p-8 rounded-3xl border ${theme.card}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                <h2 className={`text-xl font-black ${theme.text}`}>Évolution des revenus</h2>
                <p className={`text-sm ${theme.sub}`}>Suivi de votre chiffre d'affaires global</p>
            </div>
            
            <div className={`flex items-center p-1 rounded-xl border ${dark ? 'bg-[#1c1c24] border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
              {[
                { id: 'jour', label: 'Jour' },
                { id: 'semaine', label: 'Semaine' },
                { id: 'mois', label: 'Mois' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTimeFilter(f.id)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    timeFilter === f.id 
                      ? (dark ? 'bg-[#2c2c35] text-white shadow-md' : 'bg-white text-zinc-900 shadow-sm')
                      : (dark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-zinc-900')
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c47ff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6c47ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: dark ? '#94a3b8' : '#64748b'}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={12} 
                    tick={{fill: dark ? '#94a3b8' : '#64748b'}} 
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                  />
                  <Tooltip 
                    cursor={{ stroke: dark ? '#333' : '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }} 
                    contentStyle={{ borderRadius: '16px', border: 'none', background: dark ? '#1e293b' : '#fff', color: dark ? '#fff' : '#000', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [formatCurrency(value), "Revenus"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#6c47ff" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    activeDot={{ r: 6, fill: '#6c47ff', stroke: dark ? '#0f0e1a' : '#fff', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p>Aucune transaction enregistrée pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}