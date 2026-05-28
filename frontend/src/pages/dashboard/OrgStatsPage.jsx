import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import {
  BarChart3, TrendingUp, DollarSign, Users,
  Calendar, Zap, ArrowUpRight, ArrowDownRight,
  Sparkles, Activity, Target
} from 'lucide-react';

export default function OrgStatsPage() {
  const { dark } = useSelector(s => s.theme);
  const { user } = useSelector(s => s.auth);
  const [stats, setStats] = useState({ events:0, votes:0, revenue:0, tickets:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadStats();
  }, [user]);

  const loadStats = async () => {
    setLoading(true);
    const [ev, vt, tk] = await Promise.all([
      supabase.from('events').select('*', { count:'exact', head:true }).eq('organisateur_id', user.id),
      supabase.from('votes').select('total_votes', { count:'exact' }).eq('organisateur_id', user.id),
      supabase.from('tickets').select('prix', { count:'exact' }).eq('organisateur_id', user.id),
    ]);

    const totalVotes = vt.data?.reduce((a, v) => a + (v.total_votes||0), 0) || 0;
    const revenue = tk.data?.reduce((a, t) => a + (t.prix||0), 0) || 0;

    setStats({
      events: ev.count||0,
      votes: vt.count||0,
      revenue,
      tickets: tk.count||0,
      totalVotes
    });
    setLoading(false);
  };

  const cards = useMemo(() => [
    {
      label: 'Revenus totaux',
      value: `${(stats.revenue/1000).toFixed(0)}k`,
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
      subvalue: 'ce mois',
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
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w- h- bg-violet-600/10 rounded-full blur-" />
        <div className="absolute bottom-0 left-0 w- h- bg-cyan-500/10 rounded-full blur-" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-8">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                <Activity size={14} className="text-violet-600" />
              </div>
              <span className="text- font-bold uppercase tracking-wider text-violet-600">Analytics Pro</span>
            </div>
            <h1 className={`text- sm:text-[2.5rem] font-black tracking-tight leading-none ${theme.text}`}>
              Vue d'ensemble
            </h1>
            <p className={`mt-2 ${theme.sub}`}>Suivez vos performances en temps réel</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={`px-3 py-1.5 rounded-full border ${theme.card} backdrop-blur-xl ${theme.sub}`}>
              Dernière mise à jour: maintenant
            </span>
          </div>
        </div>

        {/* STATS GRID PREMIUM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="group relative">
              {/* Glow effect */}
              <div className={`absolute -inset-0.5 rounded- bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-20 blur-xl transition duration-500`} />

              <div className={`relative h-full p- rounded- bg-gradient-to-b ${dark?'from-white/10 to-transparent':'from-zinc-200/50 to-transparent'}`}>
                <div className={`relative h-full rounded- border backdrop-blur-2xl p-5 ${theme.card} transition-all duration-300 group-hover:-translate-y-0.5`}>
                  {/* Background gradient */}
                  <div className={`absolute inset-0 rounded- bg-gradient-to-br ${card.bg} opacity-50`} />

                  <div className="relative">
                    {/* Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg shadow-black/10`}>
                        <card.icon size={18} className="text-white" />
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text- font-bold ${
                        card.up
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {card.up? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {card.change}
                      </div>
                    </div>

                    {/* Value */}
                    <div>
                      <p className={`text- font-medium uppercase tracking-wider ${theme.sub} mb-1`}>
                        {card.label}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text- font-black tracking-tight leading-none ${theme.text}`}>
                          {loading? '—' : card.value}
                        </p>
                      </div>
                      <p className={`text-xs mt-1 ${theme.sub}`}>{card.subvalue}</p>
                    </div>

                    {/* Mini sparkline */}
                    <div className="mt-4 h-8 flex items-end gap-0.5">
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
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Performance */}
          <div className={`lg:col-span-2 p- rounded- bg-gradient-to-b ${dark?'from-white/10':'from-zinc-200/50'}`}>
            <div className={`h-full rounded- border backdrop-blur-2xl p-6 ${theme.card}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <BarChart3 size={16} className="text-violet-600" />
                  </div>
                  <h3 className={`font-semibold ${theme.text}`}>Performance</h3>
                </div>
                <span className={`text- px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium`}>
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
                          className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all duration-700 hover:from-violet-500 hover:to-cyan-400 cursor-pointer"
                          style={{ height: `${h}%`, minHeight: '4px' }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition px-2 py-1 rounded bg-zinc-900 text-white text- whitespace-nowrap">
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
                    <div key={i} className="absolute w-full border-t border-dashed border-zinc-200/20 dark:border-white/5" style={{ top: `${i*25}%` }} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200/10">
                {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                  <span key={d} className={`text- ${theme.sub}`}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className={`p- rounded- bg-gradient-to-b ${dark?'from-white/10':'from-zinc-200/50'}`}>
            <div className={`h-full rounded- border backdrop-blur-2xl p-6 ${theme.card}`}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Target size={16} className="text-amber-600" />
                </div>
                <h3 className={`font-semibold ${theme.text}`}>Top contenus</h3>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Concert VIP', value: '84%', color: 'violet' },
                  { name: 'Vote Awards', value: '67%', color: 'blue' },
                  { name: 'Conférence', value: '52%', color: 'emerald' },
                ].map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs ${theme.text}`}>{item.name}</span>
                      <span className={`text-xs font-bold text-${item.color}-600`}>{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400 transition-all duration-1000 group-hover:w-full`}
                        style={{ width: item.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className={`w-full mt-5 py-2.5 rounded-xl border ${theme.card} text-xs font-medium ${theme.text} hover:bg-white/5 transition`}>
                Voir tout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}