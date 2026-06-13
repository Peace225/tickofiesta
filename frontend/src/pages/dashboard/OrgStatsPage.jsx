import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import {
  BarChart3, TrendingUp, DollarSign, Users,
  Calendar, Zap, ArrowUpRight, ArrowDownRight,
  Activity, Target, Clock, Ticket, CheckCircle2,
  Download // Ajout de l'icône de téléchargement
} from 'lucide-react';

export default function OrgStatsPage() {
  const { dark } = useSelector(s => s.theme);
  const { user } = useSelector(s => s.auth);
  
  const [stats, setStats] = useState({ events:0, votes:0, revenue:0, tickets:0, totalVotes: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentVotes, setRecentVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fonction de chargement mise à jour avec les VRAIES tables (user_tickets et vote_logs)
  const loadStats = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    
    try {
      // 1. Récupérer les événements de l'organisateur
      const { data: myEvents } = await supabase
        .from('events')
        .select('id, titre')
        .eq('organisateur_id', user.id);
        
      const eventIds = myEvents?.map(e => e.id) || [];

      if (eventIds.length === 0) {
        if (showLoading) setLoading(false);
        return;
      }

      // 2. Récupérer les tickets configurés pour avoir les prix
      const { data: ticketConfigs } = await supabase
        .from('tickets')
        .select('id, prix, nom, event_id')
        .in('event_id', eventIds);
        
      const ticketIds = ticketConfigs?.map(t => t.id) || [];

      // 3. Charger les VRAIS historiques d'achats et de votes
      const [soldTicketsData, votesLogsData] = await Promise.all([
        ticketIds.length > 0 
          ? supabase.from('user_tickets').select('id, created_at, ticket_type_id, user_id').in('ticket_type_id', ticketIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase.from('vote_logs').select('id, created_at, event_id, user_id').in('event_id', eventIds).order('created_at', { ascending: false })
      ]);

      const soldTickets = soldTicketsData.data || [];
      const votesLogs = votesLogsData.data || [];

      // 4. Calcul du revenu total réel
      const revenueCount = soldTickets.reduce((sum, ut) => {
        const tConf = ticketConfigs?.find(t => t.id === ut.ticket_type_id);
        return sum + Number(tConf?.prix || 0);
      }, 0);

      setStats({
        events: myEvents.length,
        votes: votesLogs.length, 
        revenue: revenueCount,
        tickets: soldTickets.length,
        totalVotes: votesLogs.length 
      });
      
      // 5. Formater pour les tableaux (6 derniers)
      const formattedRecentTickets = soldTickets.slice(0, 6).map(ut => {
        const tConf = ticketConfigs?.find(t => t.id === ut.ticket_type_id);
        const evt = myEvents?.find(e => e.id === tConf?.event_id);
        return {
          id: ut.id,
          created_at: ut.created_at,
          prix: tConf?.prix || 0,
          acheteur_nom: tConf?.nom || 'Client',
          eventTitre: evt?.titre || 'Événement inconnu'
        };
      });

      const formattedRecentVotes = votesLogs.slice(0, 6).map(v => {
        const evt = myEvents?.find(e => e.id === v.event_id);
        return {
          id: v.id,
          created_at: v.created_at,
          user_nom: 'Votant',
          eventTitre: evt?.titre || 'Événement inconnu',
          total_votes: 1
        };
      });

      setRecentTickets(formattedRecentTickets);
      setRecentVotes(formattedRecentVotes);

    } catch (error) {
      console.error("Erreur stats:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    // Premier chargement avec spinner
    loadStats(true);

    // --- TEMPS RÉEL ---
    const channel = supabase.channel('stats_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_tickets' }, () => loadStats(false))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_logs' }, () => loadStats(false))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // --- FONCTION PDF ---
  const handlePrintPdf = () => {
    window.print();
  };

  const cards = useMemo(() => [
    {
      label: 'Revenus totaux',
      value: `${(stats.revenue >= 1000 ? (stats.revenue / 1000).toFixed(0) + 'k' : stats.revenue)}`,
      subvalue: `${stats.revenue.toLocaleString('fr-FR')} FCFA`,
      icon: DollarSign,
      change: '+12.5%',
      up: true,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'from-emerald-500/10 to-teal-500/10'
    },
    {
      label: 'Événements',
      value: stats.events,
      subvalue: 'actifs',
      icon: Calendar,
      change: '+2',
      up: true,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'from-violet-500/10 to-purple-500/10'
    },
    {
      label: 'Votes créés',
      value: stats.votes,
      subvalue: `${stats.totalVotes||0} votes`,
      icon: Zap,
      change: '+8.3%',
      up: true,
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'from-blue-500/10 to-cyan-500/10'
    },
    {
      label: 'Tickets vendus',
      value: stats.tickets,
      subvalue: 'au total',
      icon: Users,
      change: '-2.1%',
      up: false,
      gradient: 'from-orange-500 to-pink-600',
      bg: 'from-orange-500/10 to-pink-500/10'
    },
  ], [stats]);

  const theme = {
    bg: dark? 'bg-[#030307]' : 'bg-[#fcfdff]',
    card: dark? 'bg-white/[0.03] border-white/[0.08]' : 'bg-white/70 border-zinc-200/50',
    text: dark? 'text-white' : 'text-zinc-900',
    sub: dark? 'text-zinc-500' : 'text-zinc-600',
  };

  return (
    <div className={`min-h-screen ${theme.bg} print:bg-white print:text-black`}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-8">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 print:hidden">
                <Activity size={14} className="text-violet-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Analytics Pro</span>
            </div>
            <h1 className={`text-3xl sm:text-[2.5rem] font-black tracking-tight leading-none ${theme.text} print:text-black`}>
              Vue d'ensemble
            </h1>
            <p className={`mt-2 ${theme.sub} print:text-gray-600`}>Suivez vos performances en temps réel</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className={`px-3 py-1.5 rounded-full border ${theme.card} backdrop-blur-xl ${theme.sub} print:hidden`}>
              🔴 En direct
            </span>
            {/* BOUTON PDF */}
            <button 
              onClick={handlePrintPdf}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border ${theme.card} backdrop-blur-xl ${theme.text} hover:bg-violet-500/10 transition-colors shadow-sm print:hidden`}
            >
              <Download size={14} className="text-violet-500" />
              <span className="font-bold">Exporter PDF</span>
            </button>
          </div>
        </div>

        {/* STATS GRID PREMIUM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="group relative print:border print:border-gray-200 print:rounded-2xl print:shadow-none">
              {/* Glow effect */}
              <div className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-20 blur-xl transition duration-500 print:hidden`} />

              <div className={`relative h-full p-[1px] rounded-3xl bg-gradient-to-b ${dark?'from-white/10 to-transparent':'from-zinc-200/50 to-transparent'} print:bg-transparent`}>
                <div className={`relative h-full rounded-[23px] border backdrop-blur-2xl p-5 ${theme.card} transition-all duration-300 group-hover:-translate-y-0.5 print:bg-white print:border-none`}>
                  {/* Background gradient */}
                  <div className={`absolute inset-0 rounded-[23px] bg-gradient-to-br ${card.bg} opacity-50 print:hidden`} />

                  <div className="relative">
                    {/* Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg shadow-black/10 print:bg-gray-100 print:shadow-none`}>
                        <card.icon size={18} className="text-white print:text-gray-800" />
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                        card.up
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 print:text-emerald-600'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 print:text-red-600'
                      }`}>
                        {card.up? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {card.change}
                      </div>
                    </div>

                    {/* Value */}
                    <div>
                      <p className={`text-xs font-medium uppercase tracking-wider ${theme.sub} mb-1 print:text-gray-500`}>
                        {card.label}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-black tracking-tight leading-none ${theme.text} print:text-black`}>
                          {loading? '—' : card.value}
                        </p>
                      </div>
                      <p className={`text-xs mt-1 ${theme.sub} print:text-gray-500`}>{card.subvalue}</p>
                    </div>

                    {/* Mini sparkline */}
                    <div className="mt-4 h-8 flex items-end gap-0.5 print:hidden">
                      {[...Array(12)].map((_, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 rounded-full bg-gradient-to-t ${card.gradient} opacity-20 group-hover:opacity-40 transition-all duration-300`}
                          style={{
                            height: `${20 + Math.sin(idx * 0.8) * 15 + Math.random() * 10}%`,
                            transitionDelay: `${idx * 20}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid lg:grid-cols-3 gap-4 mb-4">

          {/* Performance */}
          <div className={`lg:col-span-2 p-[1px] rounded-3xl bg-gradient-to-b ${dark?'from-white/10':'from-zinc-200/50'} print:border print:border-gray-200`}>
            <div className={`h-full rounded-[23px] border backdrop-blur-2xl p-6 ${theme.card} print:bg-white print:border-none`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-violet-500/10 print:bg-transparent">
                    <BarChart3 size={16} className="text-violet-600" />
                  </div>
                  <h3 className={`font-semibold ${theme.text} print:text-black`}>Performance</h3>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium`}>
                  +24% ce mois
                </span>
              </div>

              {/* Chart placeholder premium */}
              <div className="relative h-48">
                <div className="absolute inset-0 flex items-end justify-between gap-2">
                  {[40, 65, 45, 80, 60, 90, 75, 95, 70, 85, 65, 78].map((h, i) => (
                    <div key={i} className="flex-1 group/bar relative">
                      <div className="absolute bottom-0 w-full">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all duration-700 hover:from-violet-500 hover:to-cyan-400 cursor-pointer print:from-gray-400 print:to-gray-300"
                          style={{ height: `${h}%`, minHeight: '4px' }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition px-2 py-1 rounded bg-zinc-900 text-white text-xs whitespace-nowrap print:hidden">
                            {h}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="absolute w-full border-t border-dashed border-zinc-200/20 dark:border-white/5 print:border-gray-200" style={{ top: `${i*25}%` }} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200/10 print:border-gray-200">
                {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                  <span key={d} className={`text-xs ${theme.sub} print:text-gray-500`}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className={`p-[1px] rounded-3xl bg-gradient-to-b ${dark?'from-white/10':'from-zinc-200/50'} print:border print:border-gray-200`}>
            <div className={`h-full rounded-[23px] border backdrop-blur-2xl p-6 ${theme.card} print:bg-white print:border-none`}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-amber-500/10 print:bg-transparent">
                  <Target size={16} className="text-amber-600" />
                </div>
                <h3 className={`font-semibold ${theme.text} print:text-black`}>Top contenus</h3>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Concert VIP', value: '84%', color: 'violet' },
                  { name: 'Vote Awards', value: '67%', color: 'blue' },
                  { name: 'Conférence', value: '52%', color: 'emerald' },
                ].map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs ${theme.text} print:text-gray-700`}>{item.name}</span>
                      <span className={`text-xs font-bold text-${item.color}-600 print:text-gray-900`}>{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden print:bg-gray-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400 transition-all duration-1000 group-hover:w-full print:from-gray-500 print:to-gray-400`}
                        style={{ width: item.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className={`w-full mt-5 py-2.5 rounded-xl border ${theme.card} text-xs font-medium ${theme.text} hover:bg-white/5 transition print:hidden`}>
                Voir tout
              </button>
            </div>
          </div>
        </div>

        {/* --- RECENT ACTIVITY : BILLETS ET VOTES DÉTAILLÉS --- */}
        <div className="grid lg:grid-cols-2 gap-4">
          
          {/* Tableau : Historique des Billets (Design Premium) */}
          <div className={`p-[1px] rounded-3xl bg-gradient-to-b ${dark?'from-white/10':'from-zinc-200/50'} print:border print:border-gray-200`}>
            <div className={`h-full rounded-[23px] border backdrop-blur-2xl p-6 ${theme.card} print:bg-white print:border-none`}>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/10 print:bg-transparent">
                  <Ticket size={16} className="text-emerald-500 print:text-black" />
                </div>
                <h3 className={`font-semibold ${theme.text} print:text-black`}>Derniers Billets Payés</h3>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-zinc-500 text-sm animate-pulse py-4">Chargement...</div>
                ) : recentTickets.length > 0 ? (
                  recentTickets.map((ticket, i) => (
                    <div key={i} className="flex items-center justify-between group print:border-b print:border-gray-100 print:pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 print:hidden">
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text} group-hover:text-emerald-500 transition-colors print:text-black`}>
                            {ticket.acheteur_nom || 'Client Anonyme'}
                          </p>
                          <p className={`text-xs ${theme.sub} truncate max-w-[180px] print:text-gray-600`}>{ticket.eventTitre}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold text-emerald-500 print:text-black`}>{ticket.prix?.toLocaleString('fr-FR')} CFA</p>
                        <p className={`text-[10px] ${theme.sub} flex items-center justify-end gap-1 mt-0.5 print:text-gray-500`}>
                          <Clock size={10} /> {formatDate(ticket.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-500 text-xs py-4">Aucun billet vendu récemment.</div>
                )}
              </div>
            </div>
          </div>

          {/* Tableau : Historique des Votes (Design Premium) */}
          <div className={`p-[1px] rounded-3xl bg-gradient-to-b ${dark?'from-white/10':'from-zinc-200/50'} print:border print:border-gray-200`}>
            <div className={`h-full rounded-[23px] border backdrop-blur-2xl p-6 ${theme.card} print:bg-white print:border-none`}>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/10 print:bg-transparent">
                  <CheckCircle2 size={16} className="text-blue-500 print:text-black" />
                </div>
                <h3 className={`font-semibold ${theme.text} print:text-black`}>Derniers Votes Reçus</h3>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-zinc-500 text-sm animate-pulse py-4">Chargement...</div>
                ) : recentVotes.length > 0 ? (
                  recentVotes.map((vote, i) => (
                    <div key={i} className="flex items-center justify-between group print:border-b print:border-gray-100 print:pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 print:hidden">
                          <Zap size={16} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${theme.text} group-hover:text-blue-500 transition-colors print:text-black`}>
                            {vote.user_nom || 'Votant Anonyme'}
                          </p>
                          <p className={`text-xs ${theme.sub} truncate max-w-[180px] print:text-gray-600`}>{vote.eventTitre}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold text-blue-500 print:text-black`}>+ {vote.total_votes || 1} Vote(s)</p>
                        <p className={`text-[10px] ${theme.sub} flex items-center justify-end gap-1 mt-0.5 print:text-gray-500`}>
                          <Clock size={10} /> {formatDate(vote.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-500 text-xs py-4">Aucun vote enregistré récemment.</div>
                )}
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}