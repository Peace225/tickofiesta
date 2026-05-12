import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient'; 
import api from '../config/api'; 
import Spinner from '../components/ui/Spinner';
import { 
  Calendar, MapPin, Minus, Plus, 
  Share2, CheckCircle2, Image as ImageIcon,
  ChevronRight, ArrowRight, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]); 
  const [similarEvents, setSimilarEvents] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [quantities, setQuantities] = useState({});
  const [buyerInfo, setBuyerInfo] = useState({ 
    nom: user?.user_metadata?.nom || user?.nom || '', 
    email: user?.email || '', 
    telephone: '' 
  });
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('about'); 

  // Fonction pour l'image
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('events').getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id || id === 'create') return;

      try {
        setLoading(true);
        // 1. Récupération de l'événement actuel
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*, profiles:organisateur_id(nom)')
          .eq('id', id)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // 2. Récupération des tarifs (Billets)
        const { data: ticketsData } = await supabase
          .from('tarifs') 
          .select('*')
          .eq('event_id', id)
          .order('prix', { ascending: true });

        setTickets(ticketsData || []);

        // 3. LOGIQUE : ÉVÉNEMENTS SIMILAIRES
        let { data: similarData } = await supabase
          .from('events')
          .select('*')
          .eq('categorie', eventData.categorie || 'Concert')
          .neq('id', id)
          .limit(3);

        if (!similarData || similarData.length === 0) {
          const { data: fallbackData } = await supabase
            .from('events')
            .select('*')
            .neq('id', id)
            .order('created_at', { ascending: false })
            .limit(3);
          similarData = fallbackData;
        }

        setSimilarEvents(similarData || []);

      } catch (err) {
        console.error("Erreur de chargement:", err);
        toast.error("Impossible de charger l'événement");
      } finally {
        setLoading(false);
        setQuantities({}); 
      }
    };
    fetchEventData();
  }, [id]);

  useEffect(() => {
    if (user) {
      setBuyerInfo(prev => ({ 
        ...prev, 
        nom: user.user_metadata?.nom || user.nom || '', 
        email: user.email || '' 
      }));
    }
  }, [user]);

  const setQty = (ticketId, delta) => {
    setQuantities(prev => {
      const cur = prev[ticketId] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [ticketId]: next };
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const total = tickets.reduce((acc, t) => acc + (quantities[t.id] || 0) * (t.prix || 0), 0);
  const hasSelection = Object.values(quantities).some(q => q > 0);

  const handlePay = async () => {
    if (!user) { navigate('/login'); return; }
    if (!hasSelection) { toast.error('Sélectionnez au moins un billet'); return; }
    
    setPaying(true);
    try {
      const selectedTickets = Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([ticket_id, quantite]) => ({ ticket_id, quantite }));

      const { data } = await api.post('/payments/checkout', {
        tickets: selectedTickets,
        buyer: buyerInfo,
        event_id: id 
      });

      sessionStorage.setItem('last_purchases', JSON.stringify(data.data));
      navigate('/paiement/succes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la transaction');
    } finally { setPaying(false); }
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#fafbfc]',
    text: dark ? 'text-white' : 'text-[#0b1129]',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  };

  if (loading) return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center gap-4`}>
      <Spinner size="lg" />
    </div>
  );

  if (!event) return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center`}>
      <ImageIcon size={48} className="text-slate-300 mb-4 opacity-50" />
      <p className={`font-black uppercase tracking-widest ${theme.sub}`}>Événement introuvable.</p>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme.bg} pb-20 transition-colors duration-500 font-sans`}>

      {/* --- HERO BANNER CORRIGÉ (Image bien visible) --- */}
      <div className="relative h-[380px] w-full overflow-hidden bg-[#0b1129]">
        {event.image_url || event.image ? (
          <img 
            src={getImageUrl(event.image_url || event.image)} 
            alt={event.titre} 
            className="absolute inset-0 w-full h-full object-cover" 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900" />
        )}
        
        {/* Dégradé léger uniquement en bas pour que le texte reste lisible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end pb-10 max-w-6xl mx-auto px-4 lg:px-8 w-full z-10">
          <div className="flex items-center text-white/90 text-xs font-bold mb-5 gap-1.5 drop-shadow-md">
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link> <ChevronRight size={12} />
            <Link to="/events" className="hover:text-white transition-colors">Événements</Link> <ChevronRight size={12} />
            <span className="text-[#ffc107] truncate max-w-[200px]">{event.titre}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="bg-[#0052ff] text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block shadow-md">
                À la une
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3 drop-shadow-xl">
                {event.titre}
              </h1>
              <div className="flex items-center text-white/90 gap-2 text-sm font-medium drop-shadow-md">
                <MapPin size={16} className="text-white/80" /> Côte D'Ivoire (Ivory Coast)
              </div>
            </div>
            
            <button onClick={handleCopy} className="flex items-center gap-2 border border-white/40 bg-black/20 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all backdrop-blur-md shrink-0 shadow-lg">
              <Share2 size={16} /> Partager
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-10">
          
          {/* COLONNE GAUCHE */}
          <div>
            <div className="flex gap-2 mb-8 bg-gray-100/50 dark:bg-white/5 p-1 rounded-2xl inline-flex">
              <button 
                onClick={() => setActiveTab('about')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'about' ? 'bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                À propos
              </button>
              <button 
                onClick={() => setActiveTab('programme')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'programme' ? 'bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                Programme
              </button>
            </div>

            <div className="mb-8">
              <p className={`text-[15px] leading-relaxed whitespace-pre-line ${theme.sub}`}>
                {activeTab === 'about' 
                  ? (event.description || "Aucune description fournie pour cet événement.")
                  : "Programme détaillé non disponible pour le moment."
                }
              </p>
            </div>

            <div className="flex gap-2 mb-10">
              <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold px-3 py-1.5 rounded-lg">
                #{event.categorie?.toLowerCase().replace(/\s+/g, '') || 'evenement'}
              </span>
            </div>

            <div className={`flex items-center gap-4 border p-4 rounded-2xl transition-colors ${dark ? 'border-gray-800 bg-[#111827]' : 'border-gray-100 bg-white shadow-sm'}`}>
              <div className="w-14 h-14 bg-[#0052ff] text-white rounded-xl flex items-center justify-center font-black text-2xl shadow-inner">
                {event.profiles?.nom?.charAt(0)?.toUpperCase() || 'O'}
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Organisateur</p>
                <p className={`font-black text-base flex items-center gap-1.5 ${theme.text}`}>
                  {event.profiles?.nom?.toUpperCase() || 'ANONYME'} 
                  <CheckCircle2 size={16} className="text-[#0052ff] fill-blue-100 dark:fill-blue-900" />
                </p>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : BILLETS DYNAMIQUES */}
          <div className="relative">
            <div className={`rounded-[20px] overflow-hidden border shadow-[0_8px_30px_rgb(0,0,0,0.08)] sticky top-24 ${dark ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-200'}`}>
              
              <div className="bg-[#0052ff] p-5 text-white">
                <h3 className="font-bold text-[18px] tracking-tight mb-1">Obtenir des billets</h3>
                <p className="text-sm flex items-center gap-1.5 font-medium opacity-90">
                  <Calendar size={14}/> 
                  {event.date ? new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : 'Date à définir'} à {event.heure || '--h--'}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {tickets.length === 0 ? (
                  <p className="text-center text-sm font-bold text-gray-400 py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    Les billets seront bientôt disponibles.
                  </p>
                ) : (
                  tickets.map(t => (
                    <div key={t.id} className={`border rounded-2xl p-4 transition-colors ${dark ? 'border-gray-700 bg-[#1f2937]' : 'border-gray-200/80 bg-white'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`font-bold text-[14px] uppercase tracking-wide ${theme.text}`}>{t.type || t.nom}</span>
                        <span className={`font-black text-[15px] ${theme.text}`}>
                          {t.prix === 0 ? 'GRATUIT' : `${t.prix?.toLocaleString('fr-FR').replace(',', ' ')} FCFA`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setQty(t.id, -1)} 
                          className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-colors ${dark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span className={`text-[15px] font-bold w-4 text-center ${theme.text}`}>{quantities[t.id] || 0}</span>
                        <button 
                          onClick={() => setQty(t.id, 1)} 
                          className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-colors ${dark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                
                <div className="pt-2">
                  <div className={`flex justify-between items-center py-4`}>
                    <span className={`text-[15px] font-medium ${theme.sub}`}>Total</span>
                    <span className={`font-black text-lg ${theme.text}`}>
                      {total > 0 ? `${total.toLocaleString('fr-FR').replace(',', ' ')} FCFA` : <Minus size={20} className="opacity-80" strokeWidth={3} />}
                    </span>
                  </div>

                  <button 
                    onClick={handlePay}
                    disabled={!hasSelection || paying}
                    className={`w-full py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all duration-300 ${
                      hasSelection 
                        ? 'bg-[#0052ff] text-white shadow-md shadow-blue-500/30 hover:bg-blue-700' 
                        : 'bg-[#93bbf9] text-white cursor-not-allowed'
                    }`}
                  >
                    {paying ? <Spinner size="sm" color="white" /> : 'Passer à la caisse'} <ArrowRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>

            <div className={`mt-4 border rounded-[20px] p-5 transition-colors ${dark ? 'bg-[#111827] border-gray-800' : 'bg-[#fafbfc] border-gray-100 shadow-sm'}`}>
              <p className={`text-xs font-bold mb-2 ${theme.sub}`}>Contact</p>
              <p className={`text-sm font-medium flex items-center gap-2 ${theme.text}`}>
                <Phone size={16} className="text-gray-500" /> 0709079299
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ÉVÉNEMENTS SIMILAIRES --- */}
      {similarEvents.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-20 pt-10 border-t border-gray-200 dark:border-gray-800">
          <h2 className={`text-2xl font-black mb-8 ${theme.text}`}>Événements similaires</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarEvents.map((simEvent) => (
               <div key={simEvent.id} className={`rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col ${dark ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-200'}`}>
                 
                 <div className="relative h-40 bg-gray-200 dark:bg-gray-800">
                   {simEvent.image_url || simEvent.image ? (
                     <img src={getImageUrl(simEvent.image_url || simEvent.image)} alt={simEvent.titre} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-400 opacity-50" size={32}/></div>
                   )}
                   <div className="absolute inset-0 bg-black/20" />

                   <div className="absolute top-3 left-3 bg-[#ffc107] text-black text-[10px] font-black uppercase px-2 py-1 rounded">
                      Événement
                   </div>
                   <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                      <MapPin size={10} /> {simEvent.lieu?.split(',')[0] || "Côte D'Ivoire"}
                   </div>
                 </div>

                 <div className="p-4 flex flex-col flex-1">
                   <h4 className={`font-black text-[15px] mb-1 leading-tight line-clamp-1 ${theme.text}`}>{simEvent.titre}</h4>
                   <p className={`text-xs ${theme.sub} line-clamp-2 mb-4`}>{simEvent.description || "Aucune description fournie pour cet événement..."}</p>
                   
                   <div className="flex items-center justify-between mt-auto">
                      <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                        <Calendar size={12}/> 
                        {simEvent.date ? new Date(simEvent.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'À venir'}
                      </span>
                      <button 
                        onClick={() => navigate(`/events/${simEvent.id}`)}
                        className="bg-[#0052ff] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Voir plus
                      </button>
                   </div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}