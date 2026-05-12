import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import { ScanLine, Ticket, Plus, Sparkles, ArrowRight, X, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgTicketsPage() {
  const { dark } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  
  const [events, setEvents] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTarifModal, setShowTarifModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const theme = useMemo(() => ({
    bg: dark ? 'bg-[#080812]' : 'bg-gradient-to-br from-[#f8f9ff] via-[#eef1ff] to-[#f8f9ff]',
    card: dark ? 'bg-[#0f0e1a]/60 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-[#6c47ff]/5',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-600',
    input: dark ? 'bg-[#161527] border-white/10 text-white focus:border-[#6c47ff]' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#6c47ff]',
  }), [dark]);

  // Charger les événements au montage
  useEffect(() => {
    if (user?.id) fetchEvents();
  }, [user]);

  // Charger les tarifs quand l'événement change
  useEffect(() => {
    if (selectedEvent) fetchTarifs(selectedEvent.id);
    else setTarifs([]);
  }, [selectedEvent]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('id, titre, date, statut')
      .eq('organisateur_id', user.id)
      .order('date', { ascending: false });

    if (error) toast.error('Erreur chargement événements');
    else setEvents(data || []);
    setLoading(false);
  };

  const fetchTarifs = async (eventId) => {
    const { data, error } = await supabase
      .from('tarifs')
      .select('*')
      .eq('event_id', eventId)
      .order('prix', { ascending: true });

    if (error) console.error('Tarifs error:', error);
    else setTarifs(data || []);
  };

  const handleCreateTarif = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.target);
    const payload = {
      event_id: selectedEvent.id,
      organisateur_id: user.id,
      nom: formData.get('nom'),
      prix: Number(formData.get('prix')),
      quantite_totale: Number(formData.get('quantite')),
      quantite_disponible: Number(formData.get('quantite')) // Initialise le stock
    };

    const { error } = await supabase.from('tarifs').insert([payload]);

    if (error) {
      toast.error(error.code === '42501' ? 'Permission refusée' : error.message);
    } else {
      toast.success('Tarif ajouté !');
      setShowTarifModal(false);
      fetchTarifs(selectedEvent.id); // Rafraîchir la liste
      e.target.reset();
    }
    setSaving(false);
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${theme.bg}`}>
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto h-screen relative scroll-smooth custom-scrollbar">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6c47ff]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-6 md:space-y-10 pb-32 relative z-10">

          {/* Header */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-[#6c47ff]/10 border border-[#6c47ff]/20 rounded-full px-3 py-1 mb-4">
              <Sparkles size={14} className="text-[#6c47ff]" />
              <span className="text-[#6c47ff] text-[10px] font-black uppercase tracking-widest">Billetterie Smart</span>
            </div>
            <h1 className={`text-3xl md:text-5xl font-black tracking-tighter mb-2 ${theme.text}`}>
              Gestion des <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">Tickets</span>
            </h1>
            <p className={`text-xs md:text-sm font-medium ${theme.sub}`}>Créez vos tarifs et gérez les accès de vos participants.</p>
          </div>

          {/* Sélecteur d'événement */}
          <div className={`p-6 rounded-2xl border ${theme.card}`}>
            <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub} mb-3 block`}>Événement à configurer</label>
            <select
              value={selectedEvent?.id || ''}
              onChange={e => setSelectedEvent(events.find(ev => ev.id === e.target.value))}
              className={`w-full p-4 rounded-xl border outline-none text-sm font-bold transition-all ${theme.input}`}
            >
              <option value="">-- Sélectionner un événement --</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.titre} ({new Date(ev.date).toLocaleDateString('fr-FR')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Colonne Gauche: Scanner */}
            <Link
              to="/scanner"
              className={`group relative overflow-hidden p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center ${theme.card}`}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#00d4aa] to-[#00b894] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#00d4aa]/20 group-hover:scale-110 transition-transform">
                <ScanLine size={32} className="text-white" />
              </div>
              <h2 className={`text-xl font-black mb-2 ${theme.text}`}>Scanner de Billets</h2>
              <p className={`text-xs leading-relaxed ${theme.sub} mb-6`}>
                Outil de validation rapide à l'entrée de l'événement via QR Code.
              </p>
              <div className="flex items-center gap-2 text-[#00d4aa] text-[10px] font-black uppercase tracking-[0.2em]">
                Lancer le scan <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Colonne Droite: Tarifs */}
            <div className={`p-8 rounded-3xl border flex flex-col ${theme.card}`}>
              <div className="w-20 h-20 bg-gradient-to-br from-[#6c47ff] to-[#5a37e0] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#6c47ff]/20 mx-auto">
                <Ticket size={32} className="text-white" />
              </div>
              <h2 className={`text-xl font-black mb-2 text-center ${theme.text}`}>Configurations Tarifs</h2>
              <p className={`text-xs leading-relaxed ${theme.sub} mb-6 text-center`}>
                {selectedEvent ? `Tarifs actuels pour : ${selectedEvent.titre}` : 'Veuillez d\'abord choisir un événement.'}
              </p>

              <button
                onClick={() => setShowTarifModal(true)}
                disabled={!selectedEvent}
                className={`bg-gradient-to-r from-[#6c47ff] to-[#5a37e0] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center w-full gap-2 shadow-xl shadow-[#6c47ff]/20 transition-all ${
                  !selectedEvent ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
                }`}
              >
                <Plus size={16} /> Ajouter un Tarif
              </button>
            </div>
          </div>

          {/* Liste des tarifs existants (si un event est sélectionné) */}
          {selectedEvent && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className={`text-sm font-black uppercase tracking-widest ${theme.text}`}>Tarifs configurés ({tarifs.length})</h3>
              </div>
              
              {tarifs.length === 0 ? (
                <div className={`p-10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center opacity-40 ${dark ? 'border-white/10' : 'border-gray-200'}`}>
                   <Info size={32} className="mb-2" />
                   <p className="text-xs font-bold uppercase">Aucun tarif pour cet événement</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {tarifs.map((t) => (
                    <div key={t.id} className={`p-5 rounded-2xl border border-white/5 flex flex-col justify-between ${dark ? 'bg-white/5' : 'bg-white shadow-md'}`}>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-widest text-[#6c47ff] mb-1`}>{t.nom}</p>
                        <p className={`text-xl font-black ${theme.text}`}>{t.prix.toLocaleString('fr-FR')} F</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className={`text-[10px] font-bold ${theme.sub}`}>Stock: {t.quantite_totale}</span>
                        <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${t.quantite_disponible > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {t.quantite_disponible > 0 ? 'Disponible' : 'Sold Out'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Nouveau Tarif */}
        {showTarifModal && selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080812]/95 backdrop-blur-md p-4">
            <div className={`w-full max-w-md rounded-[2rem] border p-8 animate-scale-up ${theme.card}`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className={`text-xl font-black ${theme.text}`}>Nouveau Tarif</h3>
                  <p className={`text-xs font-bold text-[#6c47ff]`}>{selectedEvent.titre}</p>
                </div>
                <button onClick={() => setShowTarifModal(false)} className={`${theme.sub} hover:text-white transition-colors`}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTarif} className="space-y-5">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub} mb-2 block`}>Libellé du ticket</label>
                  <input name="nom" required placeholder="Ex: VIP Gold, Early Bird..." className={`w-full p-4 rounded-xl border outline-none text-sm font-bold ${theme.input}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub} mb-2 block`}>Prix (FCFA)</label>
                    <input name="prix" type="number" min="0" required placeholder="0" className={`w-full p-4 rounded-xl border outline-none text-sm font-bold ${theme.input}`} />
                  </div>
                  <div>
                    <label className={`text-[10px] font-black uppercase tracking-widest ${theme.sub} mb-2 block`}>Quantité</label>
                    <input name="quantite" type="number" min="1" required placeholder="100" className={`w-full p-4 rounded-xl border outline-none text-sm font-bold ${theme.input}`} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white p-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#6c47ff]/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Confirmer la création
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}