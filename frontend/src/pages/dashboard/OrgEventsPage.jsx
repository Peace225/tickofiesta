import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import CreateEventModal from './CreateEventModal';
import Spinner from '../../components/ui/Spinner';
import {
  Plus, Calendar, ToggleLeft, ToggleRight, Sparkles,
  Ticket, MapPin, ImageIcon, Edit3, ArrowRight, Pointer
} from 'lucide-react';
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
    await supabase.from('events').update({ vote_actif: !current }).eq('id', id);
    setEvents(events.map(ev => ev.id === id ? { ...ev, vote_actif: !current } : ev));
    toast.success(current ? 'Votes désactivés' : 'Votes activés');
  };

  const theme = {
    card: dark ? 'bg-[#0f0e1a]/80 border-white/5' : 'bg-white border-gray-100 shadow-lg',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-600',
  };

  if (loading) return <div className="h-screen grid place-items-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
            <Sparkles size={12} /> Gestion Productions
          </div>
          <h1 className={`text-3xl md:text-4xl font-black ${theme.text}`}>Mes Événements</h1>
        </div>

        <div className="flex flex-col gap-4">
          {/* Aides masquées sur mobile (hidden md:flex) */}
          <div className="hidden md:flex justify-end gap-4">
             <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-800/30">
               <Ticket size={14} className="text-emerald-500" />
               <p className={`text-[10px] font-bold ${theme.text} uppercase tracking-wider`}>
                 Billetterie : <span className="text-emerald-500 underline">Configurez ici</span>
               </p>
             </div>
          </div>

          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="w-full md:w-auto bg-violet-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-violet-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-600/20"
          >
            <Plus size={16} /> Nouvelle Production
          </button>
        </div>
      </div>

      {/* Grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {events.map(event => (
            <div key={event.id} className={`p-4 md:p-5 rounded-2xl border ${theme.card} flex flex-col sm:flex-row gap-4 hover:border-violet-500/30 transition-colors`}>
              <div className="w-full sm:w-24 h-40 sm:h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {event.image ? <img src={event.image} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="m-auto mt-8 opacity-30" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold truncate ${theme.text}`}>{event.titre}</h3>
                <p className="text-violet-600 text-[10px] font-bold uppercase">{event.categorie}</p>
                <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] mt-2 ${theme.sub}`}>
                  <span className="flex items-center gap-1"><Calendar size={12} />{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{event.lieu}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => { setEditingEvent(event); setShowForm(true); }} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-bold flex items-center gap-1"><Edit3 size={12} />Modif.</button>
                  <button onClick={() => handleToggleVote(event.id, event.vote_actif)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${event.vote_actif ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                    {event.vote_actif ? <ToggleRight size={12} /> : <ToggleLeft size={12} />} Votes
                  </button>
                  <Link to="/dashboard/tickets" state={{ eventId: event.id }} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold flex items-center gap-1"><Ticket size={12} /> Tickets</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${theme.card}`}>
           <p className={theme.sub}>Aucun événement pour le moment.</p>
        </div>
      )}

      <CreateEventModal show={showForm} eventToEdit={editingEvent} onClose={() => { setShowForm(false); setEditingEvent(null); }} onSuccess={loadEvents} />
    </div>
  );
}