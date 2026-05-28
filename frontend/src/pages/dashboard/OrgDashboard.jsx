import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import Spinner from '../../components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingBag, Layout, PiggyBank, Store, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgDashboard() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [events, setEvents] = useState([]);
  const [revenus, setRevenus] = useState([]);
  const [cagnottes, setCagnottes] = useState([]);
  const [stands, setStands] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-CI', {
    style: 'currency', currency: 'XOF', maximumFractionDigits: 0
  }).format(amount || 0).replace('XOF', 'FCFA');

  // --- NOTIFICATIONS TEMPS RÉEL AMÉLIORÉES ---
  useEffect(() => {
    if (!user?.id) return;

    const handleUpdate = (payload, type) => {
      if (payload.new.organisateur_id === user.id && payload.new.statut === 'validé') {
        const message = `${type} "${payload.new.titre || payload.new.nom}" a été validé !`;
        toast.success(message, { icon: '✅' });
        setNotifications(prev => [{ id: Date.now(), message }, ...prev].slice(0, 5));
      }
    };

    const channel = supabase
      .channel('admin-validations')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, (p) => handleUpdate(p, 'Événement'))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cagnottes' }, (p) => handleUpdate(p, 'Cagnotte'))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stands' }, (p) => handleUpdate(p, 'Stand'))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ev, rev, cag, std] = await Promise.all([
        supabase.from('events').select('id, titre, statut').eq('organisateur_id', user.id),
        supabase.from('stats_organisateurs').select('*').eq('organisateur_id', user.id),
        supabase.from('cagnottes').select('*').eq('organisateur_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('stands').select('id,nom,event_id,statut,prix_location,created_at').eq('organisateur_id', user.id).order('created_at', { ascending: false }).limit(5)
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

  // ... (useMemo stats et chartData identiques)
  const stats = useMemo(() => ({
    events: events.length,
    ventes: revenus.reduce((a, r) => a + (r.billets_vendus || 0), 0),
    ca: revenus.reduce((a, r) => a + (r.total || 0), 0),
    cagnottes: cagnottes.reduce((a, c) => a + (c.montant_actuel || 0), 0),
    stands: stands.filter(s => s.statut !== 'disponible').length,
    standsTotal: stands.length
  }), [revenus, events, cagnottes, stands]);

  const chartData = useMemo(() => revenus.slice(0, 5).map(r => ({ name: r.event?.titre?.substring(0, 10) || 'Event', revenus: r.total || 0 })), [revenus]);

  const theme = {
    bg: dark ? 'bg-[#050507]' : 'bg-[#fafbff]',
    card: dark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-zinc-200 shadow-sm',
    text: dark ? 'text-white' : 'text-zinc-900',
    sub: 'text-zinc-500',
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

  return (
    <div className={`min-h-screen ${theme.bg} p-4 lg:p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="rounded-3xl p-8 bg-gradient-to-br from-violet-600 to-indigo-700 shadow-xl text-white flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Bonjour, {user?.user_metadata?.nom || 'Organisateur'}</h1>
            <p className="opacity-80">Voici vos performances en temps réel.</p>
          </div>
          <div className="relative p-3 bg-white/20 rounded-full">
            <Bell size={24} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-indigo-700 animate-bounce" />
            )}
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Événements', value: stats.events, icon: Layout },
            { label: 'Billets', value: stats.ventes, icon: ShoppingBag },
            { label: "CA", value: formatCurrency(stats.ca), icon: TrendingUp },
            { label: 'Cagnottes', value: formatCurrency(stats.cagnottes), icon: PiggyBank },
            { label: 'Stands', value: `${stats.stands}/${stats.standsTotal}`, icon: Store },
          ].map((k, i) => (
            <div key={i} className={`p-5 rounded-2xl border ${theme.card}`}>
              <k.icon className="mb-3 text-violet-500" size={24} />
              <p className={`text-xl font-bold ${theme.text}`}>{k.value}</p>
              <p className={`text-xs uppercase ${theme.sub}`}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Contenu principal... (Graphiques et listes inchangés) */}
      </div>
    </div>
  );
}