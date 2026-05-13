import { useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabaseClient'; 
import Spinner from '../components/ui/Spinner';
import { 
  Calendar, MapPin, Search, X, 
  SlidersHorizontal, Sparkles, 
  ArrowUpRight
} from 'lucide-react';

// Hook allégé pour la visibilité
function useInView(threshold = 0.05) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { 
      if (e.isIntersecting) { setInView(true); obs.disconnect(); } 
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Couleurs pré-calculées
const CATEGORY_COLORS = {
  Concert: 'bg-[#6c47ff]',
  Conference: 'bg-[#0ea5e9]',
  Sport: 'bg-[#00d4aa]',
  Festival: 'bg-[#f5a623]',
  Concours: 'bg-[#e84393]',
  Autre: 'bg-gray-500',
};

const CATEGORIES_LIST = ['Concert', 'Conference', 'Sport', 'Festival', 'Concours', 'Autre'];

export default function EventsPage() {
  const [searchParams] = useSearchParams();
  const { dark } = useSelector((s) => s.theme);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categorie, setCategorie] = useState('');
  const [tri, setTri] = useState('recent');
  const [heroRef, heroInView] = useInView();

  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, _id, titre, categorie, lieu, date, image, vote_actif, tickets')
          .eq('statut', 'validé');

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Erreur de chargement:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicEvents();
  }, []);

  const filtered = useMemo(() => {
    let r = events;
    if (categorie) r = r.filter(e => e.categorie === categorie);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(e => 
        (e.titre && e.titre.toLowerCase().includes(q)) || 
        (e.categorie && e.categorie.toLowerCase().includes(q)) || 
        (e.lieu && e.lieu.toLowerCase().includes(q))
      );
    }
    return [...r].sort((a, b) => tri === 'recent' 
      ? new Date(b.date) - new Date(a.date) 
      : new Date(a.date) - new Date(b.date)
    );
  }, [events, search, categorie, tri]);

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    card: dark ? 'bg-[#0f0e1a] border-white/5' : 'bg-white border-gray-100 shadow-sm',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* HERO SECTION - Allégée */}
      <section className="relative h-[300px] md:h-[40vh] flex items-center overflow-hidden bg-slate-900">
        <img 
           src="/fond ecran evenement.jpg" 
           alt="Events Cover" 
           className="absolute inset-0 w-full h-full object-cover opacity-50"
           loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-transparent to-transparent" />
        
        <div ref={heroRef} className={`relative z-10 max-w-7xl mx-auto px-4 md:px-6 transition-opacity duration-700 ${heroInView ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-1.5 bg-black/40 border border-white/20 rounded-full px-3 py-1.5 mb-4">
            <Sparkles size={12} className="text-[#f5a623]" />
            <span className="text-white text-[10px] font-black tracking-widest uppercase">Expériences</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-2">
            NOS <span className="text-[#00d4aa]">ÉVÉNEMENTS.</span>
          </h1>
        </div>
      </section>

      {/* SEARCH BAR - Sans le gros blur coûteux */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -translate-y-6 relative z-20">
        <div className={`flex flex-col lg:flex-row gap-2 p-2 rounded-[2rem] border ${theme.card}`}>
          <div className="flex-1 flex items-center gap-3 px-4 py-2">
            <Search size={18} className="text-[#6c47ff]" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Titre, ville..."
              className="flex-1 bg-transparent text-sm font-bold focus:outline-none placeholder:opacity-50" 
            />
            {search && <button onClick={() => setSearch('')} className="text-red-500"><X size={16} /></button>}
          </div>
          <div className="h-px lg:w-px lg:h-8 bg-gray-500/20 self-center hidden lg:block" />
          <div className="flex items-center gap-2 px-4 py-2 border-t lg:border-t-0 border-gray-500/10">
            <SlidersHorizontal size={14} className="opacity-50" />
            <select 
              value={tri} 
              onChange={(e) => setTri(e.target.value)}
              className="bg-transparent text-sm font-black focus:outline-none cursor-pointer"
            >
              <option value="recent">Récents</option>
              <option value="ancien">Anciens</option>
            </select>
          </div>
        </div>

        {/* PILLS CATÉGORIES */}
        <div className="flex gap-2 flex-wrap mt-6">
          <button 
            onClick={() => setCategorie('')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${!categorie ? 'bg-[#6c47ff] text-white' : `border ${theme.card} ${theme.sub}`}`}
          >
            TOUT
          </button>
          {CATEGORIES_LIST.map((cat) => {
            const count = events.filter(e => e.categorie === cat).length;
            if (!count) return null;
            return (
              <button 
                key={cat} 
                onClick={() => setCategorie(categorie === cat ? '' : cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border transition-colors ${categorie === cat ? 'bg-[#6c47ff] text-white' : `${theme.card} ${theme.sub}`}`}
              >
                <span className={`w-2 h-2 rounded-full ${categorie === cat ? 'bg-white' : CATEGORY_COLORS[cat] || CATEGORY_COLORS.Autre}`} />
                {cat.toUpperCase()} <span className="opacity-50 text-[10px] ml-1">{count}</span>
              </button>
            );
          })}
        </div>

        {/* GRID ÉVÉNEMENTS */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`mt-10 text-center py-20 rounded-3xl border-2 border-dashed ${theme.card}`}>
            <p className={`text-xl font-black mb-2 ${theme.text}`}>Aucun événement</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-10 pb-20">
            {filtered.map((event) => (
              <Link 
                key={event.id || event._id} 
                to={`/events/${event.id || event._id}`}
                className={`group rounded-[1.5rem] overflow-hidden border transition-transform hover:-translate-y-1 hover:shadow-lg ${theme.card}`}
              >
                <div className="relative aspect-[4/5] bg-slate-800">
                  <img 
                    src={event.image || '/api/placeholder/400/500'} 
                    alt={event.titre} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1.5 rounded-md flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[event.categorie] || CATEGORY_COLORS.Autre}`} />
                      {event.categorie?.toUpperCase() || 'AUTRE'}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-3 left-3">
                     <p className="text-white/70 text-[9px] font-black uppercase mb-0.5">À partir de</p>
                     <p className="text-xl font-black text-[#f5a623]">
                      {event.tickets?.[0]?.prix ? `${event.tickets[0].prix.toLocaleString()} F` : 'Gratuit'}
                     </p>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className={`text-base font-black leading-tight mb-3 line-clamp-2 h-10 ${theme.text}`}>
                    {event.titre?.toUpperCase()}
                  </h3>
                  <div className="space-y-2 mb-4">
                    <div className={`flex items-center gap-2 text-[11px] font-bold ${theme.sub}`}>
                      <Calendar size={14} className="text-[#6c47ff]" />
                      {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] font-bold ${theme.sub}`}>
                      <MapPin size={14} className="text-[#00d4aa]" />
                      <span className="truncate">{event.lieu}</span>
                    </div>
                  </div>
                  <button className="w-full bg-blue-50/50 text-[#6c47ff] text-[10px] font-black py-2.5 rounded-xl group-hover:bg-[#6c47ff] group-hover:text-white transition-colors flex items-center justify-center gap-1.5">
                    RÉSERVER <ArrowUpRight size={14} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}