import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient'; 
import Spinner from '../../components/ui/Spinner';
import DashboardLayout from '../../components/layout/DashboardLayout';
import toast from 'react-hot-toast';
import { 
  Plus, Trash2, ArrowLeft, Users, 
  Ticket, Star, MapPin, Calendar, 
  Settings2, Zap, ShieldAlert, ExternalLink
} from 'lucide-react';

export default function TicketsManager() {
  const { event_id } = useParams();
  const { dark } = useSelector((s) => s.theme);
  
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [ticketForm, setTicketForm] = useState({ type: 'Standard', prix: '', quantite_disponible: '' });
  const [candidatForm, setCandidatForm] = useState({ nom: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIQUE SUPABASE : CHARGEMENT ---
  const load = async () => {
    setLoading(true);
    try {
      const [eventRes, ticketsRes, candidatsRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', event_id).single(),
        supabase.from('tickets').select('*').eq('event_id', event_id).order('prix', { ascending: true }),
        supabase.from('candidats').select('*').eq('event_id', event_id).order('created_at', { ascending: true })
      ]);

      if (eventRes.error) throw eventRes.error;
      
      setEvent(eventRes.data);
      setTickets(ticketsRes.data || []);
      setCandidats(candidatsRes.data || []);
      
    } catch (err) {
      console.error('Erreur Supabase:', err);
      toast.error('Erreur lors du chargement des données');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, [event_id]);

  // --- LOGIQUE SUPABASE : AJOUT TICKET ---
  const handleAddTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newTicket = { 
        event_id, 
        type: ticketForm.type, 
        prix: Number(ticketForm.prix), 
        quantite_disponible: Number(ticketForm.quantite_disponible),
        quantite_vendue: 0
      };

      const { error } = await supabase.from('tickets').insert([newTicket]);
      if (error) throw error;

      toast.success('Nouveau type de billet ajouté !', { icon: '🎟️' });
      setTicketForm({ type: 'Standard', prix: '', quantite_disponible: '' });
      load();
    } catch (err) { 
      console.error(err);
      toast.error('Erreur lors de l\'ajout du billet');
    } finally { setIsSubmitting(false); }
  };

  // --- LOGIQUE SUPABASE : SUPPRESSION TICKET ---
  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Attention : Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.')) return;
    
    try {
      // Optionnel : vérifier si des ventes ont déjà eu lieu sur ce ticket avant de supprimer
      const ticketToDelete = tickets.find(t => t.id === id);
      if(ticketToDelete && ticketToDelete.quantite_vendue > 0) {
          toast.error("Impossible de supprimer un ticket qui a déjà été vendu.");
          return;
      }

      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Ticket supprimé avec succès');
      load();
    } catch (err) { 
      console.error(err);
      toast.error('Erreur lors de la suppression.'); 
    }
  };

  // --- LOGIQUE SUPABASE : AJOUT CANDIDAT ---
  const handleAddCandidat = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('candidats').insert([{ ...candidatForm, event_id }]);
      if (error) throw error;
      
      toast.success('Candidat inscrit avec succès !', { icon: '⭐' });
      setCandidatForm({ nom: '', description: '' });
      load();
    } catch (err) { 
      console.error(err);
      toast.error('Erreur lors de l\'ajout du candidat'); 
    } finally { setIsSubmitting(false); }
  };

  // --- LOGIQUE SUPABASE : SUPPRESSION CANDIDAT ---
  const handleDeleteCandidat = async (id) => {
      if (!window.confirm('Retirer ce candidat du concours ?')) return;
      try {
          const { error } = await supabase.from('candidats').delete().eq('id', id);
          if (error) throw error;
          toast.success('Candidat retiré.');
          load();
      } catch (err) {
          toast.error('Erreur lors de la suppression.');
      }
  };

  // --- STYLES PREMIUM ---
  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0f0e1a]/80 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50',
    input: dark ? 'bg-[#161527] border-white/10 text-white placeholder-white/20 focus:border-[#6c47ff] focus:ring-[#6c47ff]/20' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#6c47ff] focus:ring-[#6c47ff]/20',
    row: dark ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'bg-white border border-gray-100 hover:bg-gray-50 shadow-sm',
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="lg" />
        <span className={`text-xs font-black uppercase tracking-widest animate-pulse ${theme.sub}`}>Chargement du gestionnaire...</span>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <Link 
              to="/dashboard/events" 
              className={`group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-6 transition-colors ${dark ? 'text-white/50 hover:text-[#6c47ff]' : 'text-gray-500 hover:text-[#6c47ff]'}`}
            >
              <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center group-hover:-translate-x-1 transition-transform">
                <ArrowLeft size={12} />
              </div>
              Retour aux événements
            </Link>
            
            <h1 className={`text-3xl md:text-4xl font-black tracking-tighter mb-3 ${theme.text}`}>
              Gestion <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">Avancée</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-4">
              <span className={`text-sm font-bold flex items-center gap-1.5 ${theme.text}`}>
                <Settings2 size={16} className="text-[#6c47ff]" /> {event?.titre}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500/30" />
              <span className={`text-xs font-medium flex items-center gap-1.5 ${theme.sub}`}>
                <MapPin size={12} /> {event?.lieu || 'Non spécifié'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500/30" />
              <span className={`text-xs font-medium flex items-center gap-1.5 ${theme.sub}`}>
                <Calendar size={12} /> {event?.date ? new Date(event.date).toLocaleDateString('fr-FR') : 'Date à définir'}
              </span>
            </div>
          </div>

          {/* ✅ BOUTON LIEN PUBLIC AVEC SLUG */}
          {event && (
            <Link 
              to={`/events/${event.slug || event.id}`} 
              target="_blank"
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${dark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100'}`}
            >
              <ExternalLink size={16} /> Voir la page
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* --- MODULE BILLETS --- */}
          <div className={`rounded-[2rem] p-6 md:p-8 border ${theme.card}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#6c47ff]/10 flex items-center justify-center">
                <Ticket size={20} className="text-[#6c47ff]" />
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tight ${theme.text}`}>Billetterie</h2>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.sub}`}>Gérez vos quotas et tarifs</p>
              </div>
            </div>

            {/* Formulaire Ajout Billet */}
            <form onSubmit={handleAddTicket} className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl mb-6 space-y-4 border border-gray-200 dark:border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Type de billet</label>
                  <select 
                    value={ticketForm.type} 
                    onChange={(e) => setTicketForm({ ...ticketForm, type: e.target.value })}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none focus:ring-2 appearance-none cursor-pointer ${theme.input}`}
                  >
                    <option value="Standard">Standard</option>
                    <option value="VIP">VIP</option>
                    <option value="VVIP">VVIP</option>
                    <option value="Early Bird">Early Bird</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Prix (FCFA)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    placeholder="Ex: 5000" 
                    value={ticketForm.prix}
                    onChange={(e) => setTicketForm({ ...ticketForm, prix: e.target.value })}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none focus:ring-2 ${theme.input}`} 
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Quota disponible</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    placeholder="Ex: 100" 
                    value={ticketForm.quantite_disponible}
                    onChange={(e) => setTicketForm({ ...ticketForm, quantite_disponible: e.target.value })}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none focus:ring-2 ${theme.input}`} 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white rounded-xl px-6 py-3 text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#6c47ff]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </form>

            {/* Liste des Billets */}
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl">
                  <ShieldAlert size={24} className={`mx-auto mb-2 opacity-30 ${theme.sub}`} />
                  <p className={`text-xs font-bold ${theme.sub}`}>Aucun billet configuré pour cet événement.</p>
                </div>
              ) : (
                tickets.map((t) => {
                  const percent = t.quantite_disponible > 0 ? (t.quantite_vendue / t.quantite_disponible) * 100 : 0;
                  return (
                    <div key={t.id} className={`p-4 rounded-2xl transition-colors ${theme.row}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${dark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}`}>
                            {t.type}
                          </span>
                          <span className="font-black text-lg text-[#6c47ff]">{t.prix.toLocaleString('fr-FR')} F</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteTicket(t.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 bg-red-400/10 hover:bg-red-500 hover:text-white transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {/* Jauge de vente */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className={theme.sub}><Users size={10} className="inline mr-1" />{t.quantite_vendue || 0} vendus</span>
                          <span className={theme.text}>Sur {t.quantite_disponible}</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-full rounded-full ${percent >= 100 ? 'bg-red-500' : 'bg-[#00d4aa]'}`} 
                            style={{ width: `${Math.min(percent, 100)}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* --- MODULE CANDIDATS (VOTES) --- */}
          <div className={`rounded-[2rem] p-6 md:p-8 border ${theme.card}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#f5a623]/10 flex items-center justify-center">
                <Star size={20} className="text-[#f5a623]" />
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tight ${theme.text}`}>Candidats au vote</h2>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.sub}`}>Configurez votre concours</p>
              </div>
            </div>

            {/* Formulaire Ajout Candidat */}
            <form onSubmit={handleAddCandidat} className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl mb-6 space-y-4 border border-gray-200 dark:border-white/5">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Nom du candidat / Groupe</label>
                <input 
                  required 
                  type="text"
                  placeholder="Ex: Équipe Alpha" 
                  value={candidatForm.nom}
                  onChange={(e) => setCandidatForm({ ...candidatForm, nom: e.target.value })}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none focus:ring-2 ${theme.input}`} 
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Description courte (Optionnel)</label>
                <input 
                  type="text"
                  placeholder="Ex: Les favoris du public..." 
                  value={candidatForm.description}
                  onChange={(e) => setCandidatForm({ ...candidatForm, description: e.target.value })}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all outline-none focus:ring-2 ${theme.input}`} 
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#f5a623] to-[#fbbf24] text-black rounded-xl px-6 py-3 text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#f5a623]/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap size={16} className="fill-current" /> Inscrire au concours
              </button>
            </form>

            {/* Liste des Candidats */}
            <div className="space-y-3">
              {candidats.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl">
                  <Star size={24} className={`mx-auto mb-2 opacity-30 ${theme.sub}`} />
                  <p className={`text-xs font-bold ${theme.sub}`}>Aucun candidat inscrit pour le moment.</p>
                </div>
              ) : (
                candidats.map((c) => (
                  <div key={c.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${theme.row}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-inner">
                      {c.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm truncate ${theme.text}`}>{c.nom}</p>
                      {c.description && <p className={`text-[10px] font-medium truncate mt-0.5 ${theme.sub}`}>{c.description}</p>}
                    </div>
                     <button 
                          onClick={() => handleDeleteCandidat(c.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 bg-red-400/10 hover:bg-red-500 hover:text-white transition-colors"
                          title="Supprimer candidat"
                        >
                          <Trash2 size={14} />
                     </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}