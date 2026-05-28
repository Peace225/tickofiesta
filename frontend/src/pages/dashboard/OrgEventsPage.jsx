import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import CreateEventModal from './CreateEventModal';
import Spinner from '../../components/ui/Spinner';
import { Plus, Calendar, ToggleLeft, ToggleRight, Sparkles, Ticket, MapPin, Clock, ImageIcon, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgEventsPage() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('events').select('*').eq('organisateur_id', user.id).order('created_at', { ascending: false });
      setEvents(data || []);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleToggleVote = async (id, current) => {
    await supabase.from('events').update({ vote_actif:!current }).eq('id', id);
    setEvents(events.map(ev => ev.id === id? {...ev, vote_actif:!current } : ev));
    toast.success(current? 'Votes désactivés' : 'Votes activés');
  };

  const theme = {
    card: dark? 'bg-[#0f0e1a]/80 border-white/5' : 'bg-white border-gray-100 shadow-lg',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-600',
  };

  if (loading) return <div className="h- grid place-items-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-600 px-3 py-1 rounded-full text- font-bold uppercase tracking-widest mb-2">
            <Sparkles size={12} /> Gestion Productions
          </div>
          <h1 className={`text-4xl font-black ${theme.text}`}>Mes Événements</h1>
          <p className={`text-sm ${theme.sub}`}>{events.length} production{events.length>1?'s':''}</p>
        </div>
        <button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="bg-violet-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-violet-700 flex items-center gap-2">
          <Plus size={16} /> Nouvelle Production
        </button>
      </div>

      {/* Grid */}
      {events.length > 0? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {events.map(event => (
            <div key={event.id} className={`p-5 rounded-2xl border ${theme.card} flex gap-5`}>
              <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {event.image? <img src={event.image} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="m-auto mt-12 opacity-30" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold truncate ${theme.text}`}>{event.titre}</h3>
                <p className="text-violet-600 text-xs font-bold uppercase">{event.categorie}</p>
                <div className={`flex items-center gap-3 text-xs mt-2 ${theme.sub}`}>
                  <span className="flex items-center gap-1"><Calendar size={12} />{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{event.lieu}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setEditingEvent(event); setShowForm(true); }} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text- font-bold flex items-center gap-1"><Edit3 size={12} />Modifier</button>
                  <button onClick={() => handleToggleVote(event.id, event.vote_actif)} className={`px-3 py-1.5 rounded-lg text- font-bold flex items-center gap-1 ${event.vote_actif?'bg-violet-600 text-white':'bg-gray-100'}`}>
                    {event.vote_actif? <ToggleRight size={12}/> : <ToggleLeft size={12}/>} Votes
                  </button>
                  <Link to="/dashboard/tickets" state={{ eventId: event.id }} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text- font-bold flex items-center gap-1"><Ticket size={12}/> Billets</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${theme.card}`}>
          <p className={theme.sub}>Aucun événement. Créez votre première production.</p>
        </div>
      )}

      <CreateEventModal show={showForm} eventToEdit={editingEvent} onClose={() => { setShowForm(false); setEditingEvent(null); }} onSuccess={loadEvents} />
    </div>
  );
}