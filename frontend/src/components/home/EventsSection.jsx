import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { 
  Calendar, Tent, Trophy, Heart, ChevronLeft, ChevronRight, 
  Zap, Hash, MapPin, Tag, Banknote, Star, Check, Lock, X
} from "lucide-react";
import Spinner from "../ui/Spinner";
import toast from "react-hot-toast";

export default function EventsSection({ eventsRef, eventsInView, searchQuery }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [activeCandidats, setActiveCandidats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState([]); 
  const [userFavorites, setUserFavorites] = useState([]); // <-- NOUVEAU: Stocke les favoris de l'utilisateur

  const PAGE_SIZE = 8; 

  const getImageUrl = (path, bucket = 'events') => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path; 
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const getInitials = (name) => {
    if (!name) return 'OR';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const extractDateAndTime = (dateString) => {
    if (!dateString) return { dateStr: '', heureStr: '' };
    const d = new Date(dateString);
    const dateStr = d.toLocaleDateString('fr-FR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return { dateStr, heureStr: `${h}h${m}` };
  };

  const toggleFollow = async (organisateurId) => {
    if (!user) {
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden`}
        >
          <div className="p-4 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                  <Lock size={18} className="text-[#e65c00]" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-black text-gray-900 uppercase tracking-wide">
                  Connexion requise
                </p>
                <p className="mt-1 text-[11px] text-gray-500 font-medium leading-relaxed">
                  Connectez-vous pour suivre cet organisateur et ne rater aucun de ses prochains événements !
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate('/login');
                    }}
                    className="bg-[#e65c00] hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-[11px] font-bold transition-colors shadow-sm"
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-100">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ), { duration: 5000, position: 'top-center' });
      
      return;
    }
    
    if (!organisateurId) return;

    const isSubscribed = following.includes(organisateurId);

    if (isSubscribed) {
      setFollowing(prev => prev.filter(id => id !== organisateurId));
      toast.success("Abonnement annulé", { icon: '👋' });
      
      await supabase
        .from('abonnements')
        .delete()
        .eq('user_id', user.id)
        .eq('organisateur_id', organisateurId);
    } else {
      setFollowing(prev => [...prev, organisateurId]);
      toast.success("Vous êtes maintenant abonné !", { icon: '✅' });
      
      await supabase
        .from('abonnements')
        .insert({ user_id: user.id, organisateur_id: organisateurId });
    }
  };

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // 1. Charger les abonnements
        const { data: abonnementsData } = await supabase
          .from('abonnements')
          .select('organisateur_id')
          .eq('user_id', session.user.id);
          
        if (abonnementsData) {
          setFollowing(abonnementsData.map(a => a.organisateur_id));
        }

        // 2. Charger les favoris existants (NOUVEAU)
        const { data: favorisData } = await supabase
          .from('favorites')
          .select('event_id')
          .eq('user_id', session.user.id);

        if (favorisData) {
          setUserFavorites(favorisData.map(f => f.event_id));
        }
      }

      const now = new Date().toISOString();

      const { data: resEvents, error: evError } = await supabase
        .from('events')
        .select('*, profiles(full_name, nom)') 
        .eq('statut', 'validé')
        .gte('date', now)
        .order('date', { ascending: true });

      if (evError) console.error("Erreur events:", evError);

      const eventsWithSocialProof = (resEvents || []).map(ev => ({
        ...ev,
        fakeLikes: Math.floor(Math.random() * 150) + 5 
      }));

      setFeaturedEvents(eventsWithSocialProof.slice(0, 4));
      setEvents(eventsWithSocialProof.slice(4));

      // AJOUT DU SLUG DANS LA REQUÊTE DES VOTES
      const { data: resCandidats } = await supabase
        .from('candidats')
        .select('id, vote_id, nom, photo_url, photo_path, numero, votes(title, slug)')
        .order('numero', { ascending: true }) 
        .limit(25);

      setActiveCandidats((resCandidats || []).map(c => ({
        ...c,
        fakeSoutiens: Math.floor(Math.random() * 800) + 120 
      })));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const filteredData = useMemo(() => {
    let results = events;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(i => 
        i.titre?.toLowerCase().includes(q) || 
        i.lieu?.toLowerCase().includes(q)
      );
    }
    return results;
  }, [events, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const displayedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const EventCard = ({ item }) => {
    const { dateStr, heureStr } = extractDateAndTime(item.date);
    
    const organisateurNom = item.profiles?.full_name || item.profiles?.nom || 'Organisateur inconnu';
    const orgId = item.organisateur_id;
    
    const isSubscribed = following.includes(orgId);
    const isInitiallyLiked = userFavorites.includes(item.id);

    // États locaux
    const [isLiked, setIsLiked] = useState(isInitiallyLiked);
    const [likesCount, setLikesCount] = useState(item.fakeLikes + (isInitiallyLiked ? 1 : 0));
    const [isProcessingLike, setIsProcessingLike] = useState(false);

    // Mettre à jour si les favoris de l'utilisateur changent en arrière-plan
    useEffect(() => {
      setIsLiked(isInitiallyLiked);
    }, [isInitiallyLiked]);

    const handleLike = async (e) => {
      e.preventDefault(); 
      
      if (!user) {
        toast.error("Connectez-vous pour ajouter aux favoris", { icon: '🔒' });
        navigate('/login');
        return;
      }

      if (isProcessingLike) return;
      setIsProcessingLike(true);

      const previousLikedState = isLiked;
      
      // MISE À JOUR VISUELLE INSTANTANÉE (+1 / -1)
      setIsLiked(!previousLikedState);
      setLikesCount(prev => previousLikedState ? prev - 1 : prev + 1);

      try {
        if (!previousLikedState) {
          // Ajout en BDD
          const { error: favError } = await supabase
            .from('favorites')
            .insert({ user_id: user.id, event_id: item.id });

          if (favError) throw favError;

          // Abonnement automatique à l'organisateur
          if (orgId && !isSubscribed) {
            const { error: subError } = await supabase
              .from('abonnements')
              .insert({ user_id: user.id, organisateur_id: orgId });
            
            if (!subError) {
              setFollowing(prev => [...prev, orgId]);
            }
          }
        } else {
          // Suppression en BDD
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('event_id', item.id);

          if (error) throw error;
        }
      } catch (error) {
        // En cas d'erreur de la BDD, on annule l'effet visuel
        setIsLiked(previousLikedState);
        setLikesCount(prev => previousLikedState ? prev + 1 : prev - 1);
        console.error("Erreur favoris:", error);
        toast.error("Action impossible");
      } finally {
        setIsProcessingLike(false);
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-2xl flex flex-col hover:shadow-xl transition-shadow duration-300">
        <div className="relative w-full aspect-[4/3] rounded-t-2xl overflow-hidden">
          <img src={getImageUrl(item.image)} className="w-full h-full object-cover" alt={item.titre} />
          <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-800 to-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></span>
            EN COURS
          </div>
          {item.categorie && (
            <div className="absolute bottom-3 right-3 bg-[#e11d48] text-white px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-sm">
              <Tag size={12} /> {item.categorie}
            </div>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-3 mb-3">
            <h3 className="font-bold text-[14px] text-gray-800 line-clamp-2 leading-tight uppercase flex-1">{item.titre}</h3>
            {/* BOUTON J'AIME CONNECTÉ */}
            <button 
              onClick={handleLike}
              disabled={isProcessingLike}
              className="flex flex-col items-center shrink-0 cursor-pointer group disabled:opacity-50"
            >
              <Heart 
                size={20} 
                className={`transition-all duration-300 ${isLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-700 group-hover:text-red-500 group-hover:scale-110'}`} 
              />
              <span className={`text-[11px] font-medium transition-colors ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>
                {likesCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-gray-600 text-[12px] mb-2 font-medium">
            <Calendar size={14} className="shrink-0" />
            <span>{dateStr} | {heureStr} GMT</span>
          </div>

          <div className="flex items-center gap-2 text-green-600 text-[13px] font-bold mb-2">
            <Banknote size={16} className="shrink-0" />
            <span>{item.prix > 0 ? `${item.prix.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-500 text-[12px] mb-4">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{item.lieu || "Lieu à préciser"}</span>
          </div>

          <Link to={`/events/${item.slug || item.id}`} className="w-full bg-[#ef4444] hover:bg-red-600 text-white rounded-full py-2.5 flex items-center justify-center transition-colors shadow-sm mb-4">
            <span className="text-[13px] font-bold">Acheter tickets</span>
          </Link>

          <div className="mt-auto border-t border-gray-200 pt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {getInitials(organisateurNom)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-gray-400 leading-tight">Publié par</span>
                <span className="text-[11px] font-bold text-gray-800 truncate">
                  {organisateurNom}
                </span>
              </div>
            </div>
            
            {orgId && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  toggleFollow(orgId);
                }}
                className={`text-[10px] font-medium px-3 py-1.5 rounded-full shrink-0 transition-colors flex items-center gap-1 ${
                  isSubscribed 
                    ? 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-red-50' 
                    : 'bg-[#1f2937] text-white hover:bg-black'
                }`}
              >
                {isSubscribed ? (
                  <><Check size={12} className="text-green-600" /> Abonné</>
                ) : (
                  "S'abonner"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section ref={eventsRef} className={`py-8 md:py-12 transition-all duration-1000 ${eventsInView ? "opacity-100" : "opacity-0"} bg-gray-100`}>
      <div className="max-w-[1400px] mx-auto px-2 md:px-6">
        
        <div className="bg-white rounded-t-2xl md:rounded-[24px] shadow-2xl overflow-hidden border border-gray-200">
          
          <div className="bg-[#e65c00] text-white py-4 px-4 md:px-8 flex items-center overflow-hidden relative">
            <Zap className="fill-white mr-3 shrink-0" size={24} />
            <h2 className="text-xl md:text-2xl font-black italic tracking-wide shrink-0">
              TOP ÉVÉNEMENTS TICKOFIESTA
            </h2>
            <div className="ml-6 flex-1 whitespace-nowrap overflow-hidden text-[10px] md:text-xs font-bold italic opacity-90 uppercase tracking-widest hidden md:block">
              — DÉCOUVREZ LES MEILLEURS ÉVÉNEMENTS — RÉSERVATIONS INSTANTANÉES 🔥
            </div>
          </div>

          <div className="p-4 md:p-8">
            
            <div className="flex justify-center mb-10">
              <div className="flex flex-wrap justify-center gap-2 p-1.5 rounded-xl bg-gray-50 border border-gray-200">
                {[
                  { label: 'Événements', icon: Calendar, path: '/' },
                  { label: 'Stands', icon: Tent, path: '/stands' },
                  { label: 'Votes', icon: Trophy, path: '/votes' },
                  { label: 'Cagnottes', icon: Heart, path: '/cagnottes' }
                ].map((tab, i) => (
                  <button key={i} onClick={() => navigate(tab.path)} className={`px-5 py-2.5 rounded-lg text-[11px] md:text-xs font-bold uppercase flex items-center gap-2 transition-all ${i === 0 ? 'bg-[#e65c00] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>
                    <tab.icon size={16} /> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? <div className="flex justify-center py-20"><Spinner size="lg" color="#e65c00" /></div> : (
              <>
                {/* SECTION CANDIDATS */}
                {activeCandidats.length > 0 && (
                  <div className="mb-12 bg-purple-50/50 p-4 md:p-6 rounded-2xl border border-purple-100">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-3.5 w-3.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                        </div>
                        <h3 className="font-black text-sm md:text-base uppercase text-gray-900 tracking-wider">
                          En direct : Candidats en lice
                        </h3>
                      </div>
                      <span className="hidden md:block text-purple-300 font-bold">|</span>
                      <div className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-md w-fit shadow-sm">
                        <Trophy size={14} className="text-purple-600" />
                        {Array.isArray(activeCandidats[0]?.votes) 
                          ? activeCandidats[0]?.votes[0]?.title 
                          : activeCandidats[0]?.votes?.title || "Compétitions actives"}
                      </div>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x">
                      {activeCandidats.map((candidat) => {
                        const voteData = Array.isArray(candidat.votes) ? candidat.votes[0] : candidat.votes;
                        const nomConcours = voteData?.title;
                        const slugConcours = voteData?.slug; 
                        
                        return (
                          <div key={candidat.id} className="min-w-[260px] md:min-w-[300px] bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 snap-start hover:border-purple-300 transition-colors shadow-sm">
                            <img src={getImageUrl(candidat.photo_url || candidat.photo_path, 'candidats')} alt={candidat.nom} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[12px] md:text-xs text-gray-900 line-clamp-1 leading-tight mb-0.5">{candidat.nom}</h4>
                              <p className="text-[9px] text-gray-500 font-medium line-clamp-1 mb-1.5 flex items-center gap-1">
                                <Trophy size={10} className="text-yellow-500 shrink-0" /> {nomConcours || "Compétition en cours"}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1 text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                                  <Hash size={10} /> N° {candidat.numero || '-'}
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                                  <Heart size={10} className="fill-rose-500" /> {candidat.fakeSoutiens}
                                </div>
                              </div>
                              <Link to={`/votes/${slugConcours || candidat.vote_id}`} className="block text-center bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase py-1.5 rounded-lg transition-colors">Voter</Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SECTION A LA UNE */}
                {featuredEvents.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-5">
                      <Star className="text-[#e65c00] fill-[#e65c00]" size={20} />
                      <h3 className="font-black text-sm md:text-base uppercase text-gray-900 tracking-wider">Événements à la une</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {featuredEvents.map(item => <EventCard key={`featured-${item.id}`} item={item} />)}
                    </div>
                  </div>
                )}

                {/* SECTION TOUS LES ÉVÉNEMENTS */}
                <div>
                  <div className="flex items-center gap-2 mb-5 border-t border-gray-100 pt-8">
                    <Calendar className="text-gray-400" size={20} />
                    <h3 className="font-black text-sm md:text-base uppercase text-gray-900 tracking-wider">Tous nos événements</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {displayedData.length > 0 ? displayedData.map((item) => (
                      <EventCard key={`all-${item.id}`} item={item} />
                    )) : <p className="col-span-full text-center py-10 font-bold text-gray-500">Aucun événement ne correspond à vos critères.</p>}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8 pb-4">
                      <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={20}/></button>
                      <span className="font-bold text-sm text-gray-600">Page {page + 1} / {totalPages}</span>
                      <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={20}/></button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}