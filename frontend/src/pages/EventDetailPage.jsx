import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import Spinner from '../components/ui/Spinner';
import {
  MapPin, Minus, Plus, ArrowLeft, Share2, Trophy,
  Store, PiggyBank, Users, Calendar, Clock, AlertCircle, ArrowRight,
  ShieldCheck, Mail, Phone, Building2, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { id } = useParams(); // id peut être un slug OU un uuid
  const navigate = useNavigate();
  const { dark } = useSelector((s) => s.theme);

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [votesList, setVotesList] = useState([]);
  const [stands, setStands] = useState([]);
  const [cagnottes, setCagnottes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [paying, setPaying] = useState(false);
  
  // État pour gérer la description (Voir plus / Voir moins)
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const MAX_DESC_LENGTH = 300;

  const getImageUrl = (path, bucket = 'events') => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return;
      try {
        setLoading(true);

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let query = supabase.from('events').select('*, profiles:organisateur_id(*)');
        
        if (isUuid) {
          query = query.eq('id', id);
        } else {
          query = query.eq('slug', id);
        }

        const { data: eventData, error: eventErr } = await query.single();

        if (eventErr || !eventData) throw new Error("Événement introuvable");
        
        setEvent(eventData);
        const eventId = eventData.id;

        const [ticketsRes, standsRes, votesRes, cagnottesRes] = await Promise.all([
          supabase.from('tarifs').select('*').eq('event_id', eventId).order('prix', { ascending: true }),
          supabase.from('stands').select('*').eq('event_id', eventId),
          supabase.from('votes').select('*').eq('event_id', eventId),
          supabase.from('cagnottes').select('*').eq('event_id', eventId)
        ]);
        
        setTickets(ticketsRes.data || []);
        setStands(standsRes.data || []);
        setVotesList(votesRes.data || []);
        setCagnottes(cagnottesRes.data || []);

      } catch (err) {
        console.error("Erreur critique:", err);
        toast.error("Impossible de charger l'événement");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id, navigate]);

  const setQty = (ticketId, delta) => setQuantities(prev => ({...prev, [ticketId]: Math.max(0, (prev[ticketId] || 0) + delta) }));

  const handleShare = () => {
    const shareData = {
      title: event.titre,
      text: `Découvre cet événement incroyable : ${event.titre}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const selectedTickets = tickets.filter(t => (quantities[t.id] || 0) > 0).map(t => ({
          ticket_type_id: t.id,
          quantity: quantities[t.id],
          unit_price: t.prix
      }));

      if (total === 0) {
        const { data, error } = await supabase.functions.invoke('init-geniuspay', {
          body: { event_id: event.id, user_id: user.id, tickets: selectedTickets, total_amount: 0 }
        });
        if (error) throw error;
        toast.success("Réservation gratuite validée avec succès!");
        setPaying(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('init-geniuspay', {
        body: { event_id: event.id, user_id: user.id, tickets: selectedTickets, total_amount: total }
      });

      if (error) throw error;
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast.success("Réservation validée!");
      }
    } catch (err) {
      console.error("Erreur détaillée de la fonction backend :", err);
      toast.error("Le serveur a rencontré une erreur");
    } finally {
      setPaying(false);
    }
  };

  const total = tickets.reduce((acc, t) => acc + (quantities[t.id] || 0) * (t.prix || 0), 0);
  const hasSelection = Object.values(quantities).some(qty => qty > 0);

  const getBadgeStyle = (type) => {
    const name = (type || '').toLowerCase();
    if (name.includes('vvip')) return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/20';
    if (name.includes('vip')) return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500/20';
    return 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-transparent';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!event) return <div className="text-center py-20">Événement introuvable.</div>;

  const organizerProfile = event.profiles
   ? (Array.isArray(event.profiles)? event.profiles[0] : event.profiles)
    : null;

  const organizerName = organizerProfile?.nom || organizerProfile?.full_name || "Organisateur de l'événement";
  const organizerEmail = organizerProfile?.email || "Non renseigné";
  const organizerPhone = organizerProfile?.telephone || organizerProfile?.phone || organizerProfile?.phone_number || "Non renseigné";

  const fakeParticipantsCount = (event.titre?.length || 10) * 12 + 150;
  
  const isDescLong = event.description?.length > MAX_DESC_LENGTH;

  return (
    <div className={`min-h-screen ${dark? 'bg-[#06060c]' : 'bg-[#f4f7fd]'} pb-20`}>
      <div className="relative w-full bg-[#030712] overflow-hidden py-6 lg:py-8 border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_0%,rgba(0,184,255,0.18),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_700px_at_0%_100%,rgba(16,185,129,0.08),transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6 lg:gap-8 items-center">
            
            <div className="space-y-4 md:space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button 
                  onClick={() => navigate(-1)} 
                  className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-all font-black uppercase tracking-widest text-[9px] md:text-[10px] bg-white/5 hover:bg-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/5 shadow-inner"
                >
                  <ArrowLeft size={12} strokeWidth={3} /> Retour
                </button>

                <button 
                  onClick={handleShare} 
                  className="inline-flex items-center gap-1.5 md:gap-2 text-sky-400 hover:text-white transition-all font-black tracking-wide text-[10px] md:text-xs bg-sky-500/10 hover:bg-sky-500/30 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-sky-500/20 shadow-inner"
                >
                  <Share2 size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={2.5} /> Partager
                </button>
              </div>
              
              <div className="space-y-2 md:space-y-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-black tracking-wider uppercase bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400 border border-sky-500/30">
                  <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-sky-400 animate-pulse" /> Événement Vedette
                </span>
                {/* TITRE REDUIT SUR MOBILE */}
                <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight max-w-3xl drop-shadow-sm">
                  {event.titre}
                </h1>
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3 pt-1">
                <div className="flex items-center gap-2 md:gap-2.5 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-white/90 border border-white/[0.06] text-[10px] md:text-xs font-bold shadow-2xl transition-all">
                  <div className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-sky-500/10 text-sky-400"><Calendar size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={2.5} /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Date</span>
                    <span>{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-2.5 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-white/90 border border-white/[0.06] text-[10px] md:text-xs font-bold shadow-2xl transition-all">
                  <div className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-sky-500/10 text-sky-400"><Clock size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={2.5} /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Heure</span>
                    <span>{event.heure?.slice(0, 5) || "12:30"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-2.5 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-white/90 border border-white/[0.06] text-[10px] md:text-xs font-bold shadow-2xl transition-all">
                  <div className="p-1 md:p-1.5 rounded-md md:rounded-lg bg-sky-500/10 text-sky-400"><MapPin size={12} className="md:w-[14px] md:h-[14px]" strokeWidth={2.5} /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Lieu</span>
                    <span className="max-w-[100px] md:max-w-[150px] truncate">{event.lieu}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4 mt-3 md:mt-4 pt-4 md:pt-6 border-t border-white/10">
                <div className="flex -space-x-2 md:-space-x-3">
                  <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=64&h=64&fit=crop&crop=faces" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#030712] object-cover shadow-sm" alt="Participant" />
                  <img src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=64&h=64&fit=crop&crop=faces" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#030712] object-cover shadow-sm" alt="Participant" />
                  <img src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=64&h=64&fit=crop&crop=faces" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#030712] object-cover shadow-sm" alt="Participant" />
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#030712] bg-sky-500/20 flex items-center justify-center backdrop-blur-md shadow-sm">
                    <span className="text-sky-400 text-[8px] md:text-[10px] font-black">+{fakeParticipantsCount}</span>
                  </div>
                </div>
                <div>
                  <p className="text-white/90 text-xs md:text-sm font-bold">Personnes intéressées</p>
                  <p className="text-white/50 text-[9px] md:text-[11px] font-medium">Rejoignez-les avant rupture de stock</p>
                </div>
              </div>

            </div>

            {event.image && (
              <div className="hidden lg:block relative w-full h-full group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-all duration-1000" />
                <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transform group-hover:scale-[1.02] transition-all duration-500">
                  <img src={getImageUrl(event.image)} className="w-full h-40 md:h-48 object-cover object-top" alt={event.titre} />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 md:mt-10 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 md:gap-10 items-start">
        <section className="space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800/60 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 md:h-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600" />
            <div className="flex items-center gap-2 mb-3 md:mb-4"><span className="w-6 md:w-8 h-px bg-sky-500/50"></span><span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-sky-500">Expérience immersive</span></div>
            <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 tracking-tight text-slate-800 dark:text-white">À propos de l'événement</h3>
            
            {event.image && (
              <div className="mb-5 md:mb-8 overflow-hidden rounded-[1.2rem] md:rounded-[1.8rem] shadow-sm flex justify-center bg-slate-50 dark:bg-slate-800/30 p-2 md:p-3">
                <img src={getImageUrl(event.image)} className="w-full h-auto max-h-[350px] md:max-h-[600px] object-contain rounded-xl md:rounded-[1.2rem]" alt="event" />
              </div>
            )}
            
            <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap font-medium tracking-wide border-l-2 border-sky-500/40 pl-3 md:pl-4 relative">
              {isDescExpanded || !isDescLong 
                ? event.description 
                : `${event.description?.substring(0, MAX_DESC_LENGTH)}...`}
              
              {isDescLong && (
                <button 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="mt-3 md:mt-4 flex items-center gap-1 md:gap-1.5 text-xs md:text-sm font-black text-sky-500 hover:text-sky-600 transition-colors"
                >
                  {isDescExpanded ? (
                    <>Voir moins <ChevronUp size={14} className="md:w-4 md:h-4" strokeWidth={3} /></>
                  ) : (
                    <>Lire la suite <ChevronDown size={14} className="md:w-4 md:h-4" strokeWidth={3} /></>
                  )}
                </button>
              )}
            </div>

          </div>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800/60 shadow-xl relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-32 md:w-40 h-32 md:h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <h4 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2 md:gap-2.5"><Building2 size={18} className="md:w-[22px] md:h-[22px] text-emerald-500" />Organisateur & Contact</h4>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-center">
              <div className="p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10 shadow-sm shrink-0"><ShieldCheck size={20} className="md:w-6 md:h-6" /></div>
                <div>
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">Certifié par la plateforme</span>
                  <p className="text-base md:text-lg font-black text-slate-800 dark:text-white mt-0.5 leading-tight">{organizerName}</p>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3 pl-1 md:pl-2">
                <div className="flex items-center gap-2 md:gap-3 text-slate-600 dark:text-slate-400 text-xs md:text-sm font-semibold"><MapPin size={14} className="md:w-4 md:h-4 text-slate-400 shrink-0" /><span className="truncate">{event.lieu}</span></div>
                <div className="flex items-center gap-2 md:gap-3 text-slate-600 dark:text-slate-400 text-xs md:text-sm font-semibold"><Mail size={14} className="md:w-4 md:h-4 text-slate-400 shrink-0" /><span className="truncate">{organizerEmail}</span></div>
                <div className="flex items-center gap-2 md:gap-3 text-slate-600 dark:text-slate-400 text-xs md:text-sm font-semibold"><Phone size={14} className="md:w-4 md:h-4 text-slate-400 shrink-0" /><span>{organizerPhone}</span></div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5 md:space-y-6 lg:sticky lg:top-8">
          
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h3 className="font-black text-xl md:text-2xl tracking-tight text-slate-900 dark:text-white">Billetterie</h3>
                <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5 md:mt-1">Sélectionnez vos accès uniques</p>
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-5">
              {tickets.length > 0 ? (
                tickets.map(t => {
                  const isVVIP = (t.type || t.nom).toLowerCase().includes('vvip');
                  const isVIP = !isVVIP && (t.type || t.nom).toLowerCase().includes('vip');
                  
                  return (
                    <div key={t.id} className="relative group overflow-hidden rounded-2xl md:rounded-[1.5rem] border border-slate-100 dark:border-slate-700/60 shadow-sm transition-all duration-300 hover:shadow-xl">
                      <div className="absolute inset-0 z-0">
                        <div className={`w-full h-full opacity-10 dark:opacity-20 ${
                          isVVIP ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                          isVIP ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                          'bg-slate-200 dark:bg-slate-700'
                        }`} />
                        <div className="absolute inset-0 opacity-[0.03] dark:opacity-5 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                      </div>

                      <div className="relative z-10 p-4 md:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full flex flex-col justify-between">
                        
                        <div className="flex justify-between items-start gap-2 md:gap-3 mb-4 md:mb-6">
                          <div className="space-y-1 flex-1">
                            <span className={`inline-block text-[9px] md:text-[10px] uppercase font-extrabold tracking-wider px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl shadow-sm border leading-relaxed text-left ${getBadgeStyle(t.type || t.nom)}`}>
                              {t.type || t.nom}
                            </span>
                            {t.description && <p className="text-[10px] md:text-[11px] text-slate-500 font-medium mt-1.5 md:mt-2">{t.description}</p>}
                          </div>
                          
                          <div className="flex items-center gap-1.5 md:gap-2.5 bg-white dark:bg-slate-800 p-1 md:p-1.5 rounded-lg md:rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
                            <button onClick={() => setQty(t.id, -1)} className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md md:rounded-lg hover:bg-rose-500 hover:text-white transition-all active:scale-95"><Minus size={12} className="md:w-3.5 md:h-3.5" strokeWidth={3} /></button>
                            <span className="font-black text-xs md:text-sm w-4 md:w-5 text-center text-slate-800 dark:text-white select-none">{quantities[t.id] || 0}</span>
                            <button onClick={() => setQty(t.id, 1)} className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-sky-500 text-white rounded-md md:rounded-lg shadow-sm hover:bg-sky-600 transition-all active:scale-95"><Plus size={12} className="md:w-3.5 md:h-3.5" strokeWidth={3} /></button>
                          </div>
                        </div>

                        <div className="flex justify-between items-end">
                          <p className={`font-black text-2xl md:text-3xl tracking-tight ${t.prix > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-500 dark:text-emerald-400'}`}>
                            {t.prix > 0 ? <>{t.prix.toLocaleString()} <span className="text-[10px] md:text-xs font-bold text-slate-400 ml-1">FCFA</span></> : 'GRATUIT'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-6 md:py-10 px-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                  <AlertCircle size={28} className="md:w-8 md:h-8 text-slate-400 mb-2 md:mb-2.5" /><p className="text-xs md:text-sm font-bold text-slate-500 text-center">Aucun ticket configuré.</p>
                </div>
              )}
            </div>

            <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <div><span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Montant total</span></div>
                
                <span className={`text-3xl md:text-4xl font-black tracking-tight ${hasSelection && total === 0 ? 'text-emerald-500' : 'text-sky-500'}`}>
                  {hasSelection && total === 0 ? 'GRATUIT' : <>{total.toLocaleString()} <span className="text-xs md:text-sm font-black text-sky-600">FCFA</span></>}
                </span>
              </div>

              <button 
                onClick={handlePayment} 
                disabled={!hasSelection || paying} 
                className={`w-full relative group text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg uppercase tracking-wider shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-40 disabled:translate-y-0 ${hasSelection && total === 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-500/20 hover:shadow-emerald-500/40' : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/40'}`}
              >
                {paying ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" color="white" /> 
                    <span className="text-sm md:text-base">{hasSelection && total === 0 ? 'Validation...' : 'Sécurisation...'}</span>
                  </div>
                ) : (
                  <span className="text-sm md:text-base">{hasSelection && total === 0 ? 'Valider le ticket gratuit' : 'Confirmer ma réservation'}</span>
                )}
              </button>
            </div>
          </div>

          {/* CONCOURS & VOTES */}
          <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800/80 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5"><div className="p-2 md:p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]"><Trophy size={16} className="md:w-5 md:h-5" strokeWidth={2.5} /></div><div><h4 className="font-black text-base md:text-lg tracking-tight">Concours & Votes</h4><p className="text-[9px] md:text-[11px] text-slate-400 font-medium">Soutenez vos favoris</p></div></div>
            {votesList.length > 0 ? (
              <div className="space-y-2.5 md:space-y-3">
                {votesList.map(v => (
                  <div key={v.id} onClick={() => navigate(`/votes/${v.slug || v.id}`)} className="group flex justify-between items-center p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:border-amber-400/40 hover:bg-amber-50/10 cursor-pointer transition-all duration-300">
                    <div className="space-y-0.5 md:space-y-1">
                      <p className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">{v.categorie || v.titre || v.nom || 'Accéder au concours'}</p>
                      <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-400 font-medium"><Users size={10} className="md:w-3 md:h-3"/> Soutenir les candidats</span>
                    </div>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all"><ArrowRight size={12} className="md:w-3.5 md:h-3.5" /></div>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-4 md:py-5 border border-dashed rounded-xl md:rounded-2xl bg-slate-50/50 dark:bg-slate-800/10"><p className="text-[10px] md:text-xs text-slate-400 italic font-medium">Aucun concours actif lié à l'événement</p></div>}
          </div>

          {/* STANDS EXPOSANTS */}
          <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800/80 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5"><div className="p-2 md:p-2.5 rounded-xl bg-sky-500/10 text-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.15)]"><Store size={16} className="md:w-5 md:h-5" strokeWidth={2.5} /></div><div><h4 className="font-black text-base md:text-lg tracking-tight">Stands Exposants</h4><p className="text-[9px] md:text-[11px] text-slate-400 font-medium">Espaces commerciaux disponibles</p></div></div>
            {stands.length > 0 ? (
              <div className="space-y-2.5 md:space-y-3">
                {stands.map(s => (
                  <div key={s.id} onClick={() => navigate(`/stands?event=${event.slug || event.id}`)} className="flex justify-between items-center p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:border-sky-400/40 hover:bg-sky-50/10 cursor-pointer transition-all">
                    <div><p className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200">{s.nom || s.titre || 'Stand disponible'}</p><span className="text-[10px] md:text-xs text-sky-500 font-extrabold">{s.prix > 0 ? `${s.prix.toLocaleString()} FCFA` : 'Sur devis'}</span></div>
                    <button className="px-2.5 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-black bg-white dark:bg-slate-800 border rounded-lg shadow-sm hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all pointer-events-none">Réserver</button>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-4 md:py-5 border border-dashed rounded-xl md:rounded-2xl bg-slate-50/50 dark:bg-slate-800/10"><p className="text-[10px] md:text-xs text-slate-400 italic font-medium">Les réservations de stands ne sont pas ouvertes</p></div>}
          </div>

          {/* CAGNOTTES SOLIDAIRES */}
          <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800/80 transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5"><div className="p-2 md:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)]"><PiggyBank size={16} className="md:w-5 md:h-5" strokeWidth={2.5} /></div><div><h4 className="font-black text-base md:text-lg tracking-tight">Cagnottes Solidaires</h4><p className="text-[9px] md:text-[11px] text-slate-400 font-medium">Soutenez le financement du projet</p></div></div>
            {cagnottes.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {cagnottes.map(cg => {
                  const pct = Math.min(100, Math.round((cg.montant_actuel / cg.objectif_montant) * 100)) || 0;
                  return (
                    <div key={cg.id} onClick={() => navigate(`/cagnottes/${cg.slug || cg.id}`)} className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 space-y-1.5 md:space-y-2 cursor-pointer hover:border-emerald-400/40 hover:bg-emerald-50/10 transition-all">
                      <div className="flex justify-between items-center"><p className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200 truncate max-w-[70%]">{cg.titre || cg.nom || 'Cagnotte de l\'événement'}</p><span className="text-[10px] md:text-xs font-black text-emerald-500 bg-emerald-500/10 px-1.5 md:px-2 py-0.5 rounded-md">{pct}%</span></div>
                      <div className="w-full h-1.5 md:h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-1000 rounded-full" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="text-center py-4 md:py-5 border border-dashed rounded-xl md:rounded-2xl bg-slate-50/50 dark:bg-slate-800/10"><p className="text-[10px] md:text-xs text-slate-400 italic font-medium">Aucune cagnotte active pour le moment</p></div>}
          </div>
        </aside>
      </main>
    </div>
  );
}