import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabaseClient";
import {
  Calendar, MapPin, ChevronLeft, ChevronRight,
  Music, Palette, GraduationCap, Wine, Map, Dumbbell, Tent, Atom, Church, Utensils, Briefcase, LayoutGrid, Shield,
  CheckCircle2, User, Trophy
} from "lucide-react";
import Spinner from "../ui/Spinner";

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
  const catScrollRef = useRef(null);
  
  // 👈 MODIFICATION ICI : 16 éléments pour faire exactement 4 lignes de 4 colonnes
  const PAGE_SIZE = 16; 

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

      const { data: resEvents, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('statut', 'validé')
        .gte('date', now)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const orgIds = [...new Set(resEvents.map(e => e.organisateur_id).filter(Boolean))];

      let profilesMap = {};
      if (orgIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('id, nom').in('id', orgIds);
        profs?.forEach(p => profilesMap[p.id] = p);
      }

      const finalEvents = resEvents.map(e => ({
        ...e,
        organisateur: profilesMap[e.organisateur_id] || { nom: 'Organisateur' },
        catInfo: catsData?.find(c => c.id === e.categorie_id) || { nom: e.categorie || 'Autre', slug: 'autre' }
      }));

      setEvents(finalEvents);

    } catch (err) {
      console.error("Erreur de chargement des événements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    
    const eventsChannel = supabase.channel('realtime:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        if (payload.new && payload.new.statut === 'validé') {
          fetchData(false);
        }
      });

    eventsChannel.subscribe();
    return () => { supabase.removeChannel(eventsChannel); };
  }, [fetchData]);

  const filteredData = useMemo(() => {
    let results = [...events];
    if (activeCat !== "Toutes") {
      results = results.filter(item => item.catInfo?.nom === activeCat);
    }
    const query = searchQuery?.toLowerCase().trim();
    if (query) {
      results = results.filter(item => item.titre?.toLowerCase().includes(query) || item.lieu?.toLowerCase().includes(query));
    }
    return results;
  }, [events, activeCat, searchQuery]);

  const displayedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  useEffect(() => { setPage(0); }, [activeCat, searchQuery]);

  const theme = {
    text: dark ? "text-white" : "text-slate-900",
    sub: dark ? "text-slate-400" : "text-slate-500",
    card: dark ? "bg-[#0f0e1a]/80 backdrop-blur-xl border-white/5 shadow-2xl" : "bg-white border-gray-100 shadow-xl",
    tabActive: "bg-[#6c47ff] text-white shadow-lg",
  };

  return (
    <section ref={eventsRef} className={`py-6 md:py-12 px-3 md:px-4 transition-all duration-1000 ${eventsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-center mb-6 md:mb-10">
          <div className={`inline-flex p-1 rounded-xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
            <button className={`px-5 md:px-8 py-2 md:py-3 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${theme.tabActive}`}>
              Événements
            </button>
            <button 
              onClick={() => navigate('/votes')}
              className={`px-5 md:px-8 py-2 md:py-3 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 text-gray-500 hover:text-[#00d4aa]`}
            >
              Votes <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
            </button>
          </div>
        </div>

        {/* Catégories */}
        <div className="relative mb-8 md:mb-12">
          <div ref={catScrollRef} className="flex overflow-x-auto gap-2.5 md:gap-4 pb-4 no-scrollbar snap-x px-1">
            {categories.map((cat) => {
              const iconKey = cat.slug?.toLowerCase() || 'autre';
              const Icon = ICON_MAP[iconKey] || Shield;
              const isActive = activeCat === cat.nom;
              return (
                <button
                  key={cat.id || cat.nom}
                  onClick={() => setActiveCat(cat.nom)}
                  className={`flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl border transition-all duration-300 shrink-0 snap-center ${
                    isActive ? "scale-105 shadow-xl border-transparent text-white" : "opacity-60 hover:opacity-100"
                  } ${dark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'}`}
                  style={isActive ? { backgroundColor: cat.couleur || '#6c47ff' } : {}}
                >
                  <Icon size={isActive ? 22 : 18} />
                  <span className="text-[8px] md:text-[10px] font-black uppercase mt-1.5 tracking-tighter text-center">{cat.nom}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des Événements */}
        {loading ? (
          <div className="flex justify-center py-10 md:py-20"><Spinner size="lg" /></div>
        ) : displayedData.length === 0 ? (
          <div className="py-16 text-center opacity-40">
             <Trophy size={40} className="mx-auto mb-3" />
             <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">Aucun événement trouvé</p>
          </div>
        ) : (
          /* 👈 MODIFICATION ICI : lg:grid-cols-4 pour avoir 4 colonnes sur PC */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {displayedData.map((item) => (
              <div key={item.id} className={`group rounded-2xl border overflow-hidden transition-all duration-500 hover:-translate-y-1 ${theme.card}`}>
                <div className="relative aspect-[16/10] overflow-hidden">
                  
                  <img 
                    src={getImageUrl(item.image_url || item.image)} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    alt={item.titre} 
                  />
                  
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1 rounded-full shadow-lg"><CheckCircle2 size={12} /></div>
                  
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-black/70 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-white/10">
                      {item.catInfo?.nom || 'Autre'}
                    </span>
                  </div>

                </div>

                <div className="p-4 md:p-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-5 h-5 rounded-full bg-[#6c47ff]/10 flex items-center justify-center"><User size={10} className="text-[#6c47ff]" /></div>
                    <span className="text-[9px] font-black uppercase text-[#6c47ff] tracking-widest truncate">{item.organisateur?.nom}</span>
                  </div>
                  <h3 className={`font-black text-sm uppercase leading-tight line-clamp-1 mb-3 ${theme.text}`}>{item.titre}</h3>
                  
                  <div className="space-y-1.5 mb-5">
                    <div className={`flex items-center gap-2 text-[10px] md:text-xs font-bold ${theme.sub}`}>
                      <Calendar size={14} className="text-[#6c47ff]" />
                      {new Date(item.date || item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                    {item.lieu && (
                      <div className={`flex items-center gap-2 text-[10px] md:text-xs font-bold ${theme.sub}`}>
                        <MapPin size={14} className="text-rose-500" />
                        <span className="truncate">{item.lieu}</span>
                      </div>
                    )}
                  </div>

                  <Link 
                    to={`/events/${item.id}`} 
                    className="block w-full text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-700"
                  >
                    Réserver
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-white/10 ${theme.card}`}>
              <ChevronLeft size={16} />
            </button>
            <span className={`text-[10px] font-black tracking-widest ${theme.text}`}>{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-white/10 ${theme.card}`}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}