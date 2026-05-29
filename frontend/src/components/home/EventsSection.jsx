import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import { 
  Calendar, Tent, Trophy, Heart, Shield, Music, Palette, 
  GraduationCap, Wine, Map, Dumbbell, Atom, Church, Utensils, 
  Briefcase, LayoutGrid, ChevronLeft, ChevronRight, Share2, MapPin, Clock, User 
} from "lucide-react";
import Spinner from "../ui/Spinner";
import toast from "react-hot-toast";

const ICON_MAP = {
  "concert": Music, "culture": Palette, "formation": GraduationCap,
  "soiree": Wine, "tourisme": Map, "sport": Dumbbell, "festival": Tent,
  "science": Atom, "religieux": Church, "gastronomie": Utensils,
  "business": Briefcase, "autre": Shield, "toutes": LayoutGrid,
};

export default function EventsSection({ eventsRef, eventsInView, dark, searchQuery }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("Toutes");
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 12;

  const getImageUrl = (path) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('events').getPublicUrl(path);
    return data.publicUrl;
  };

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data: catsData } = await supabase.from('categories').select('*').eq('is_active', true);
      setCategories([{ id: null, nom: "Toutes", slug: "toutes", couleur: "#64748b" }, ...(catsData || [])]);

      // Note : Assurez-vous que la colonne 'organisateur_nom' existe dans votre table events
      const { data: resEvents } = await supabase
        .from('events')
        .select('*')
        .eq('statut', 'validé') // Filtrage initial
        .gte('date', now)
        .order('date', { ascending: true });

      setEvents(resEvents || []);
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
    if (activeCat !== "Toutes") {
      results = results.filter(item => item.categorie === activeCat);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(i => i.titre?.toLowerCase().includes(q) || i.lieu?.toLowerCase().includes(q));
    }
    return results;
  }, [events, activeCat, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const displayedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleShare = (e, item) => {
    e.preventDefault();
    const eventIdentifier = item.slug || item.id;
    const url = `${window.location.origin}/events/${eventIdentifier}`;
    if (navigator.share) {
      navigator.share({ title: item.titre, url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  return (
    <section ref={eventsRef} className={`py-6 md:py-12 px-3 md:px-4 transition-all duration-1000 ${eventsInView ? "opacity-100" : "opacity-0"}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation */}
        <div className="flex justify-center mb-8 md:mb-10">
          <div className={`flex flex-wrap justify-center gap-1.5 p-1 rounded-2xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
            {[
              { label: 'Événements', icon: Calendar, path: '/' },
              { label: 'Stands', icon: Tent, path: '/stands' },
              { label: 'Votes', icon: Trophy, path: '/votes' },
              { label: 'Cagnottes', icon: Heart, path: '/cagnottes' }
            ].map((tab, i) => (
              <button key={i} onClick={() => navigate(tab.path)} className={`px-3 md:px-6 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase flex items-center gap-2 ${i === 0 ? 'bg-[#6c47ff] text-white shadow-lg' : 'text-slate-500'}`}>
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catégories */}
        <div className="flex overflow-x-auto gap-3 mb-8 pb-2 no-scrollbar">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.slug?.toLowerCase()] || Shield;
            const isActive = activeCat === cat.nom;
            return (
              <button key={cat.nom} onClick={() => { setActiveCat(cat.nom); setPage(0); }} 
                className={`flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl shrink-0 transition-all ${isActive ? "text-white scale-105" : "opacity-60 hover:opacity-100"}`}
                style={{ backgroundColor: isActive ? (cat.couleur || '#6c47ff') : (dark ? '#1e293b' : '#e2e8f0') }}>
                <Icon size={18} />
                <span className="text-[8px] md:text-[9px] font-black uppercase mt-1.5">{cat.nom}</span>
              </button>
            );
          })}
        </div>

        {/* Grille Événements */}
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {displayedData.length > 0 ? displayedData.map((item) => (
                <div key={item.id} className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#0f0e1a] border-white/5" : "bg-white border-gray-100 shadow-lg"}`}>
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <img src={getImageUrl(item.image_url || item.image)} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" alt={item.titre} />
                    
                    {/* Indicateur En Cours */}
                    {item.statut === 'en cours' && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-purple-600 text-white text-[9px] font-black uppercase rounded-md shadow-sm z-10">
                        En cours
                      </div>
                    )}

                    <button onClick={(e) => handleShare(e, item)} className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors">
                      <Share2 size={12} />
                    </button>
                  </div>
                  
                  <div className="p-3">
                    <h3 className={`font-black text-[11px] md:text-sm uppercase mb-2 truncate ${dark ? 'text-white' : 'text-slate-900'}`}>{item.titre}</h3>
                    
                    {/* Publié par */}
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold mb-3">
                      <User size={10} />
                      <span>Publié par {item.organisateur_nom || 'Admin'}</span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                        <Calendar size={10} />
                        <span>{new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                        <Clock size={10} className="ml-2" />
                        <span>{item.heure?.slice(0, 5) || '19:00'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                        <MapPin size={10} />
                        <span className="truncate">{item.lieu}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[10px] md:text-xs font-black ${item.prix > 0 ? 'text-sky-500' : 'text-emerald-500'}`}>
                        {item.prix > 0 ? `${item.prix.toLocaleString()} FCFA` : 'GRATUIT'}
                      </span>
                    </div>

                    <Link to={`/events/${item.slug || item.id}`} className="block w-full py-2 rounded-lg text-center text-[10px] font-black uppercase bg-rose-600 text-white hover:bg-rose-700 transition-colors">
                      Réserver
                    </Link>
                  </div>
                </div>
              )) : <p className="col-span-full text-center py-10 font-bold opacity-50">Aucun événement trouvé.</p>}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-full bg-slate-200 disabled:opacity-30"><ChevronLeft size={18}/></button>
                <span className="font-black text-xs">Page {page + 1} / {totalPages}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-2 rounded-full bg-slate-200 disabled:opacity-30"><ChevronRight size={18}/></button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}