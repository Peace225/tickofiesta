import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import {
  DollarSign, TrendingUp, Download, Calendar,
  Users, Search, Filter, ArrowUpRight, Info, Ticket, Vote,
  Activity, RefreshCw, Wallet, Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Commissions() {
  const { dark } = useSelector((s) => s.theme);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalOrganisateurs: 0,
    avgCommission: 0
  });
  const [organisateurs, setOrganisateurs] = useState([]);
  
  // États de chargement & Temps Réel
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('30');

  // Palette Institutionnelle / Fintech
  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 backdrop-blur-2xl border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.2)]' : 'bg-white border-indigo-50 shadow-2xl shadow-indigo-100/50',
    text: dark ? 'text-white' : 'text-[#0a0f25]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#0A0A12] border-white/10 text-white placeholder-white/30 focus:border-amber-500 focus:ring-amber-500/20' : 'bg-slate-50 border-gray-200 text-slate-900 placeholder-gray-400 focus:border-amber-500 focus:ring-amber-500/20',
  };

  // Formatage FCFA
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CI', { 
      style: 'currency', 
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
  };

  const loadCommissions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsUpdating(true);

    try {
      // 1. Détecter le tout 1er événement (Commission 0%)
      const { data: allEventsData } = await supabase.from('events').select('id, organisateur_id, created_at').order('created_at', { ascending: true });
      const allEvents = allEventsData || []; // Sécurité anti-crash
      
      const firstEventIds = new Set();
      const seenOrgs = new Set();
      
      allEvents.forEach(e => {
        if (!seenOrgs.has(e.organisateur_id)) {
          firstEventIds.add(e.id);
          seenOrgs.add(e.organisateur_id);
        }
      });

      // 2. Définir la période
      let startDate = null;
      if (dateRange !== 'all') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
      }

      // 3. Charger UNIQUEMENT la table purchases (Pas de requêtes imbriquées !)
      let query = supabase.from('purchases').select('*').eq('status', 'completed');
      if (startDate) query = query.gte('created_at', startDate.toISOString());
      
      const { data: purchasesData, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      const purchases = purchasesData || []; // Sécurité anti-crash si 0 ventes

      // 4. Récupérer les IDs uniques associés aux achats
      const eventIds = [...new Set(purchases.map(p => p.event_id).filter(Boolean))];
      const voteIds = [...new Set(purchases.map(p => p.vote_id).filter(Boolean))];

      let fetchedEvents = [];
      let fetchedVotes = [];

      // Charger les détails en parallèle
      if (eventIds.length > 0) {
        const { data } = await supabase.from('events').select('id, titre, organisateur_id').in('id', eventIds);
        fetchedEvents = data || [];
      }
      if (voteIds.length > 0) {
        const { data } = await supabase.from('votes').select('id, titre, organisateur_id').in('id', voteIds);
        fetchedVotes = data || [];
      }

      const orgIds = [...new Set([...fetchedEvents.map(e => e.organisateur_id), ...fetchedVotes.map(v => v.organisateur_id)].filter(Boolean))];

      let fetchedProfiles = [];
      if (orgIds.length > 0) {
        const { data } = await supabase.from('profiles').select('*').in('id', orgIds);
        fetchedProfiles = data || [];
      }

      // 5. Agrégation sécurisée via Javascript
      const eventsMap = {};
      const votesMap = {};
      const orgMap = {};

      const initOrg = (orgId) => {
        if (!orgMap[orgId]) {
          const profile = fetchedProfiles.find(p => p.id === orgId) || {};
          orgMap[orgId] = {
            id: orgId,
            nom: profile.nom || profile.raw_user_meta_data?.nom || 'Anonyme',
            email: profile.email || 'Email non disponible',
            totalVentes: 0, totalCommission: 0,
            nbBilletsVendus: 0, nbVotesVendus: 0,
            nbEvents: 0, nbConcours: 0
          };
        }
      };

      purchases.forEach(p => {
        const quantite = p.quantite || 1;
        const montant = p.montant || 0;

        if (p.event_id) {
          const ev = fetchedEvents.find(e => e.id === p.event_id);
          if (!ev || !ev.organisateur_id) return;
          initOrg(ev.organisateur_id);

          if (!eventsMap[p.event_id]) eventsMap[p.event_id] = { id: p.event_id, orgId: ev.organisateur_id, totalVentes: 0, nbBillets: 0 };
          eventsMap[p.event_id].totalVentes += montant;
          eventsMap[p.event_id].nbBillets += quantite;

        } else if (p.vote_id) {
          const vt = fetchedVotes.find(v => v.id === p.vote_id);
          if (!vt || !vt.organisateur_id) return;
          initOrg(vt.organisateur_id);

          if (!votesMap[p.vote_id]) votesMap[p.vote_id] = { id: p.vote_id, orgId: vt.organisateur_id, totalVentes: 0 };
          votesMap[p.vote_id].totalVentes += montant;
          orgMap[vt.organisateur_id].nbVotesVendus += quantite;
        }
      });

      // 6. Application stricte du Business Model
      let globalRev = 0;
      let globalCommission = 0;

      Object.values(eventsMap).forEach(e => {
        let commission = 0;
        if (!firstEventIds.has(e.id)) {
          let pourcentage = e.totalVentes <= 500000 ? 0.05 : e.totalVentes <= 2000000 ? 0.035 : 0.02;
          commission = (e.totalVentes * pourcentage) + (e.nbBillets * 200);
        }

        globalRev += e.totalVentes;
        globalCommission += commission;

        orgMap[e.orgId].totalVentes += e.totalVentes;
        orgMap[e.orgId].totalCommission += commission;
        orgMap[e.orgId].nbEvents += 1;
        orgMap[e.orgId].nbBilletsVendus += e.nbBillets;
      });

      Object.values(votesMap).forEach(v => {
        const commission = v.totalVentes * 0.20; 
        globalRev += v.totalVentes;
        globalCommission += commission;

        orgMap[v.orgId].totalVentes += v.totalVentes;
        orgMap[v.orgId].totalCommission += commission;
        orgMap[v.orgId].nbConcours += 1;
      });

      const orgsList = Object.values(orgMap).sort((a, b) => b.totalCommission - a.totalCommission);

      setOrganisateurs(orgsList);
      setStats({
        totalRevenue: globalRev,
        totalCommission: globalCommission,
        totalOrganisateurs: orgsList.length,
        avgCommission: orgsList.length > 0 ? globalCommission / orgsList.length : 0
      });
      setChartKey(prev => prev + 1);

    } catch (err) {
      console.error(err);
      if (!silent) toast.error('Erreur de chargement des flux financiers');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadCommissions();
    const channel = supabase.channel('commissions-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchases' }, () => loadCommissions(true))
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [loadCommissions]);

  const exportCSV = () => {
    const headers = ['Organisateur', 'Email', 'Ventes Totales (F)', 'Commission TickoFiesta (F)', 'Tickets Vendus', 'Événements', 'Concours'];
    const rows = organisateurs.map(org => [
      `"${org.nom}"`, org.email, org.totalVentes.toFixed(0), org.totalCommission.toFixed(0), org.nbBilletsVendus, org.nbEvents, org.nbConcours
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tresorerie_TickoFiesta_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Rapport financier exporté');
  };

  const filteredOrganisateurs = organisateurs.filter(org =>
    org.nom?.toLowerCase().includes(search.toLowerCase()) ||
    org.email?.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = useMemo(() => filteredOrganisateurs.slice(0, 5).map((o) => ({
    name: o.nom?.substring(0, 12) + '...',
    commission: o.totalCommission || 0
  })), [filteredOrganisateurs]);

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-8 pb-32">
        
        {/* HEADER DIRECTION FINANCIÈRE */}
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8 p-10 rounded-[2rem] overflow-hidden bg-[#0A0A12] border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-rose-500/10" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 backdrop-blur-md">
                <Wallet size={14} className="text-amber-400" />
                <span className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">Pôle Trésorerie</span>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                {isUpdating ? <RefreshCw size={10} className="text-emerald-400 animate-spin" /> : <Activity size={10} className={`${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />}
                <span className={`text-[9px] font-bold tracking-widest uppercase ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>{isUpdating ? "Calcul..." : isLive ? "Marché Actif" : "Hors ligne"}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Analyse des <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">Revenus</span>
            </h1>
          </div>

          <div className="relative z-10 flex gap-4">
            <button onClick={exportCSV} disabled={organisateurs.length === 0} className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 active:scale-95 transition-all shadow-lg backdrop-blur-md disabled:opacity-50">
              <Download size={16} /> Exporter Rapport
            </button>
          </div>
        </div>

        {/* STATS GLOBALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Volume d\'Affaires Brut', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: '#6366f1' },
            { label: 'Commissions TickoFiesta', value: formatCurrency(stats.totalCommission), icon: DollarSign, color: '#f5a623' },
            { label: 'Partenaires Rémunérés', value: stats.totalOrganisateurs, icon: Users, color: '#10b981' },
            { label: 'Moyenne par Partenaire', value: formatCurrency(stats.avgCommission), icon: ArrowUpRight, color: '#f43f5e' },
          ].map((stat, idx) => (
            <div key={idx} className={`group relative p-6 rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 hover:border-white/10 ${theme.card}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={20} strokeWidth={2} />
              </div>
              <p className={`text-3xl font-black tracking-tighter ${theme.text}`}>{stat.value}</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 ${theme.sub}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* SECTION DYNAMIQUE (Graphique + Règles) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 p-8 rounded-[2rem] border flex flex-col ${theme.card}`}>
            <h3 className={`text-lg font-black tracking-tight mb-8 ${theme.text}`}>Top 5 Générateurs de Commissions</h3>
            <div className="w-full h-72 min-h-[280px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer key={chartKey} width="99%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCom" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f5a623" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#f5a623" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? '#ffffff05' : '#00000005'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b', fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: dark ? '#94a3b8' : '#64748b', fontWeight: 700 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip cursor={{ fill: dark ? '#ffffff05' : '#00000005' }} contentStyle={{ backgroundColor: dark ? '#0A0A12' : '#fff', borderRadius: '16px', border: dark ? '1px solid rgba(255,255,255,0.1)' : 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', padding: '12px 20px' }} itemStyle={{ color: dark ? '#fff' : '#000', fontWeight: 900 }} formatter={(value) => [formatCurrency(value), "Commission TickoFiesta"]} />
                    <Bar dataKey="commission" radius={[8, 8, 0, 0]} barSize={40}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill="url(#colorCom)" className="hover:opacity-80 transition-opacity cursor-pointer" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <TrendingUp size={48} className="mb-4 text-amber-500" />
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Données insuffisantes</p>
                </div>
              )}
            </div>
          </div>

          <div className={`p-8 rounded-[2rem] border flex flex-col justify-between ${theme.card}`}>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center"><Info size={16} className="text-indigo-400" /></div>
                <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${theme.text}`}>Modèle Économique</h3>
              </div>
              <div className={`p-5 rounded-2xl ${dark ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-emerald-50 border border-emerald-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-3 flex items-center gap-2"><Ticket size={14}/> Billetterie</p>
                <ul className={`text-[11px] font-bold space-y-2 ${dark ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                  <li><strong className="text-emerald-500">1er event :</strong> 0% (Offert)</li>
                  <li><strong className="text-emerald-500">&lt; 500k F :</strong> 5% + 200F / billet</li>
                  <li><strong className="text-emerald-500">500k-2M F :</strong> 3.5% + 200F / billet</li>
                  <li><strong className="text-emerald-500">&gt; 2M F :</strong> 2% + 200F / billet</li>
                </ul>
              </div>
              <div className={`p-5 rounded-2xl ${dark ? 'bg-indigo-500/5 border border-indigo-500/10' : 'bg-indigo-50 border border-indigo-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-3 flex items-center gap-2"><Vote size={14}/> Votes</p>
                <ul className={`text-[11px] font-bold space-y-2 ${dark ? 'text-indigo-400/80' : 'text-indigo-700'}`}>
                  <li><strong className="text-indigo-500">Com. Fixe :</strong> 20% sur les Packs</li>
                  <li>Aucun frais fixe ajouté</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FILTRES */}
        <div className="flex flex-col md:flex-row gap-4 relative z-20">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <input type="text" placeholder="Rechercher un partenaire..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full pl-12 pr-5 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all shadow-inner ${theme.input}`} />
          </div>

          <div className="relative w-full md:w-64 group">
            <Filter size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={`w-full pl-12 pr-10 py-4 rounded-2xl border text-sm font-bold focus:outline-none transition-all appearance-none cursor-pointer shadow-inner ${theme.input}`}>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="all">Toutes les périodes</option>
            </select>
          </div>
        </div>

        {/* TABLEAU FINANCIER */}
        {loading ? (
          <div className="flex justify-center items-center py-32"><Spinner size="xl" className="border-amber-500 border-t-rose-400" /></div>
        ) : filteredOrganisateurs.length === 0 ? (
          <div className={`py-32 text-center rounded-[2rem] border transition-colors ${dark ? 'border-white/5 bg-[#0A0A12]' : 'border-indigo-50 bg-white'}`}>
            <div className="w-24 h-24 bg-amber-500/5 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/10"><Banknote size={40} /></div>
            <p className={`text-2xl font-black tracking-tighter ${theme.text}`}>{search ? 'Aucun résultat' : 'Le registre est vide'}</p>
            <p className={`text-sm mt-2 font-medium ${theme.sub}`}>Les flux financiers apparaîtront après les premières ventes.</p>
          </div>
        ) : (
          <div className={`rounded-[2rem] border overflow-hidden ${theme.card} relative`}>
            {isUpdating && <div className="absolute inset-0 z-50 bg-black/5 dark:bg-white/5 backdrop-blur-[1px] transition-all" />}
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className={`border-b ${dark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                  <tr>
                    <th className={`text-left p-6 text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Partenaire</th>
                    <th className={`text-right p-6 text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Volume d'Affaires</th>
                    <th className={`text-right p-6 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500`}>Commission Nette</th>
                    <th className={`text-right p-6 text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>Activité Réseau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 dark:divide-white/5 divide-slate-100">
                  {filteredOrganisateurs.map((org) => (
                    <tr key={org.id} className={`transition-colors duration-300 ${dark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg border border-white/10">
                            {org.nom?.[0]?.toUpperCase() || 'O'}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-black truncate ${theme.text}`}>{org.nom}</p>
                            <p className={`text-[10px] font-bold tracking-wider ${theme.sub}`}>{org.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <p className={`text-sm font-black ${theme.text}`}>{formatCurrency(org.totalVentes)}</p>
                      </td>
                      <td className="p-6 text-right">
                        <p className={`text-sm font-black text-amber-500 drop-shadow-md`}>
                          +{formatCurrency(org.totalCommission)}
                        </p>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {org.nbBilletsVendus > 0 && <span className="text-[10px] font-black tracking-widest uppercase bg-slate-500/10 text-slate-500 px-2 py-1 rounded-md">{org.nbBilletsVendus} Tickets</span>}
                          <div className="flex gap-1.5">
                             {org.nbEvents > 0 && <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md">{org.nbEvents} Events</span>}
                             {org.nbConcours > 0 && <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md">{org.nbConcours} Votes</span>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}