import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import Spinner from '../../components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, Layout, PiggyBank, Store, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgDashboard() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [events, setEvents] = useState([]);
  const [revenus, setRevenus] = useState([]);
  const [cagnottes, setCagnottes] = useState([]);
  const [stands, setStands] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour et bonne journée de travail";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir, excellente soirée";
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-CI', {
    style: 'currency', currency: 'XOF', maximumFractionDigits: 0
  }).format(amount || 0).replace('XOF', 'FCFA');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Chargement en parallèle
      const [ev, rev, cag, std] = await Promise.all([
        supabase.from('events').select('id, titre, statut').eq('organisateur_id', user.id),
        supabase.from('stats_organisateurs').select('*').eq('organisateur_id', user.id),
        supabase.from('cagnottes').select('*').eq('organisateur_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('stands').select('id, nom, event_id, statut, prix_location, created_at').eq('organisateur_id', user.id)
      ]);
      
      setEvents(ev.data || []);
      setRevenus((rev.data || []).map(s => ({...s, event: ev.data?.find(e => e.id === s.event_id) })));
      setCagnottes(cag.data || []);
      setStands(std.data || []);
    } catch (err) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const stats = useMemo(() => ({
    events: events.length,
    ventes: revenus.reduce((a, r) => a + (r.billets_vendus || 0), 0),
    ca: revenus.reduce((a, r) => a + (r.total || 0), 0),
    cagnottes: cagnottes.reduce((a, c) => a + (c.montant_actuel || 0), 0),
    standsDispo: stands.filter(s => s.statut === 'disponible').length,
    standsTotal: stands.length
  }), [revenus, events, cagnottes, stands]);

  const theme = {
    bg: dark ? 'bg-[#050507]' : 'bg-[#f8f9ff]',
    card: dark ? 'bg-[#0f0e1a] border-white/5' : 'bg-white border-zinc-100',
    text: dark ? 'text-white' : 'text-zinc-900',
    sub: dark ? 'text-zinc-400' : 'text-zinc-500',
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className={`min-h-screen ${theme.bg} p-4 lg:p-8 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${theme.text}`}>Espace Organisateur</h1>
            <p className={theme.sub}>{getGreeting()}, {user?.user_metadata?.nom || 'Organisateur'}.</p>
          </div>
          {stats.standsDispo > 0 && (
             <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 font-bold text-sm border border-amber-500/20 animate-pulse">
               <AlertCircle size={16} /> {stats.standsDispo} stands disponibles
             </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Événements', value: stats.events, icon: Layout, color: 'text-blue-500' },
            { label: 'Billets', value: stats.ventes, icon: ShoppingBag, color: 'text-emerald-500' },
            { label: "CA Total", value: formatCurrency(stats.ca), icon: TrendingUp, color: 'text-violet-500' },
            { label: 'Cagnottes', value: formatCurrency(stats.cagnottes), icon: PiggyBank, color: 'text-amber-500' },
            { label: 'Stands', value: `${stats.standsTotal - stats.standsDispo}/${stats.standsTotal}`, icon: Store, color: 'text-rose-500' },
          ].map((k, i) => (
            <div key={i} className={`p-6 rounded-3xl border ${theme.card} transition-all hover:scale-[1.02] hover:border-violet-500/30`}>
              <div className={`mb-4 ${k.color}`}><k.icon size={24} strokeWidth={2.5} /></div>
              <p className={`text-2xl font-black ${theme.text}`}>{k.value}</p>
              <p className={`text-xs font-bold uppercase tracking-widest ${theme.sub}`}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Graphique corrigé */}
        <div className={`p-8 rounded-3xl border ${theme.card}`}>
          <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className={`text-xl font-black ${theme.text}`}>Performance par événement</h2>
                <p className={`text-sm ${theme.sub}`}>Vue comparative des revenus générés</p>
            </div>
          </div>
          
          {/* Conteneur parent avec hauteur fixe indispensable pour Recharts */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenus.slice(0, 5).map(r => ({ name: r.event?.titre?.substring(0, 10) || 'Event', revenus: r.total || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: dark ? '#94a3b8' : '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: dark ? '#94a3b8' : '#64748b'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none', background: dark ? '#1e293b' : '#fff' }} />
                <Bar dataKey="revenus" radius={[12, 12, 0, 0]}>
                   {revenus.slice(0, 5).map((entry, index) => <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6c47ff' : '#8b5cf6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}