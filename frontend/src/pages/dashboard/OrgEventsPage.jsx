import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import CreateEventModal from './CreateEventModal';
import Spinner from '../../components/ui/Spinner';
import { 
  Plus, Calendar, ToggleLeft, ToggleRight, Layout, 
  Sparkles, Ticket, MapPin, Clock, ImageIcon, Edit3 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgEventsPage() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // Nouvel état pour l'édition

  const loadEvents = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organisateur_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleToggleVote = async (id, current) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ vote_actif: !current })
        .eq('id', id);

      if (error) throw error;
      
      setEvents(events.map(ev => ev.id === id ? { ...ev, vote_actif: !current } : ev));
      toast.success(current ? 'Votes désactivés' : 'Votes activés');
    } catch { 
      toast.error('Erreur de mise à jour'); 
    }
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const closeFormModal = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const statutConfig = {
    'en_attente': { cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dot: 'bg-amber-500', label: 'En attente' },
    'validé': { cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', dot: 'bg-emerald-500', label: 'Validé' },
    'refusé': { cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20', dot: 'bg-rose-500', label: 'Refusé' }
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f4f5f7]',
    card: dark ? 'bg-[#0f0e1a]/60 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-600',
  };

  if (loading) return (
    <div className={`flex min-h-screen ${theme.bg}`}>
      <DashboardSidebar />
      <main className="flex-1 flex justify-center items-center"><Spinner size="xl" /></main>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${theme.bg}`}>
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth custom-scrollbar w-full">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6c47ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-6 md:space-y-10 pb-32 relative z-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-[#6c47ff]/10 border border-[#6c47ff]/20 rounded-full px-3 py-1 mb-2">
                <Sparkles size={14} className="text-[#6c47ff]" />
                <span className="text-[#6c47ff] text-[10px] font-black uppercase tracking-widest">Gestion Productions</span>
              </div>
              <h1 className={`text-3xl md:text-5xl font-black tracking-tighter ${theme.text}`}>Mes Événements</h1>
              <p className={`text-xs md:text-sm font-medium ${theme.sub}`}>
                Vous avez {events.length} production{events.length > 1 ? 's' : ''} en cours.
              </p>
            </div>
            
            <button
              onClick={() => { setEditingEvent(null); setShowForm(true); }}
              className="group flex items-center justify-center gap-3 bg-gradient-to-r from-[#6c47ff] to-[#5a37e0] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#6c47ff]/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              Nouvelle Production
            </button>
          </div>

          {/* Grid Événements */}
          {events.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {events.map((event) => (
                <div key={event.id} className={`group relative flex flex-col sm:flex-row gap-6 p-6 rounded-[2rem] border transition-all duration-500 hover:shadow-2xl ${theme.card}`}>
                  
                  {/* Image Affiche */}
                  <div className="relative w-full sm:w-48 h-48 sm:h-auto rounded-2xl overflow-hidden shadow-lg shadow-black/20 flex-shrink-0">
                    {event.image ? (
                      <img src={event.image} alt={event.titre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-[#161527] flex items-center justify-center opacity-30">
                        <ImageIcon size={48} className="text-white" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                       <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border backdrop-blur-md ${statutConfig[event.statut]?.cls || statutConfig['en_attente'].cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statutConfig[event.statut]?.dot}`} />
                          {event.statut}
                       </span>
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 flex flex-col justify-between py-2 min-w-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className={`text-xl font-black truncate mb-1 ${theme.text}`}>{event.titre}</h4>
                        <p className={`text-xs font-bold text-[#6c47ff] uppercase tracking-widest`}>{event.categorie}</p>
                      </div>

                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 text-xs font-bold ${theme.sub}`}>
                          <Calendar size={14} className="text-[#6c47ff]" />
                          {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          <Clock size={14} className="ml-2 text-[#6c47ff]" />
                          {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`flex items-center gap-2 text-xs font-bold ${theme.sub}`}>
                          <MapPin size={14} className="text-[#00d4aa]" />
                          <span className="truncate">{event.lieu}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-6">
                      
                      {/* Action : Modifier */}
                      <button
                        onClick={() => openEditModal(event)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-500 hover:text-amber-500 hover:border-amber-500/50 text-[10px] font-black uppercase tracking-widest transition-all`}
                      >
                        <Edit3 size={16} /> Modifier
                      </button>

                      {/* Action : Votes */}
                      <button
                        onClick={() => handleToggleVote(event.id, event.vote_actif)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          event.vote_actif 
                          ? 'bg-[#6c47ff] border-[#6c47ff] text-white shadow-lg shadow-[#6c47ff]/20' 
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-[#6c47ff]/50'
                        }`}
                      >
                        {event.vote_actif ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        Votes {event.vote_actif ? 'actifs' : 'off'}
                      </button>

                      {/* Action : Billetterie */}
                      <Link
                        to="/dashboard/tickets"
                        state={{ eventId: event.id, eventTitle: event.titre }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-500 hover:text-[#00d4aa] hover:border-[#00d4aa]/50 text-[10px] font-black uppercase tracking-widest transition-all`}
                      >
                        <Ticket size={16} /> Billets
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-32 rounded-[3rem] border-2 border-dashed ${dark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="w-24 h-24 bg-gradient-to-br from-[#6c47ff]/10 to-[#5a37e0]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles size={40} className="text-[#6c47ff] opacity-40" />
              </div>
              <h3 className={`text-2xl font-black mb-2 ${theme.text}`}>Votre catalogue est vide</h3>
              <p className={`text-sm ${theme.sub} mb-10 max-w-sm mx-auto`}>Commencez à créer des expériences mémorables pour vos clients dès maintenant.</p>
              <button
                onClick={() => { setEditingEvent(null); setShowForm(true); }}
                className="bg-[#6c47ff] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#6c47ff]/20 hover:scale-105 transition-all"
              >
                Créer mon premier événement
              </button>
            </div>
          )}
        </div>

        {/* Modal de création / édition */}
        <CreateEventModal
          show={showForm}
          eventToEdit={editingEvent}
          onClose={closeFormModal}
          onSuccess={() => { loadEvents(); closeFormModal(); }}
        />
      </main>
    </div>
  );
}