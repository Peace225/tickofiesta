import { useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabaseClient'; // 👈 Import de Supabase
import Spinner from '../components/ui/Spinner';
import { 
  Calendar, MapPin, Search, X, ChevronDown, 
  Ticket, SlidersHorizontal, Sparkles, Filter, 
  ArrowUpRight, Clock
} from 'lucide-react';

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

const CATEGORY_COLORS = {
  Concert: { bg: 'bg-[#6c47ff]', glow: 'shadow-[#6c47ff]/20', text: 'text-[#6c47ff]' },
  Conference: { bg: 'bg-[#0ea5e9]', glow: 'shadow-[#0ea5e9]/20', text: 'text-[#0ea5e9]' },
  Sport: { bg: 'bg-[#00d4aa]', glow: 'shadow-[#00d4aa]/20', text: 'text-[#00d4aa]' },
  Festival: { bg: 'bg-[#f5a623]', glow: 'shadow-[#f5a623]/20', text: 'text-[#f5a623]' },
  Concours: { bg: 'bg-[#e84393]', glow: 'shadow-[#e84393]/20', text: 'text-[#e84393]' },
  Autre: { bg: 'bg-gray-500', glow: 'shadow-gray-500/20', text: 'text-gray-400' },
};

export default function EventsPage() {
  const [searchParams] = useSearchParams();
  const { dark } = useSelector((s) => s.theme);
  
  // --- States Locaux ---
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categorie, setCategorie] = useState('');
  const [tri, setTri] = useState('recent');
  const [heroRef, heroInView] = useInView(0.05);
  
  const categories = ['Concert', 'Conference', 'Sport', 'Festival', 'Concours', 'Autre'];

  // --- REQUÊTE SUPABASE DIRECTE ---
  useEffect(() => {
    const fetchPublicEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('statut', 'validé'); // 👈 Sécurité : Uniquement les événements approuvés

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicEvents();
  }, []);

  // --- FILTRES EN TEMPS RÉEL ---
  const filtered = useMemo(() => {
    let r = [...events];
    
    // Filtre Recherche
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(e => 
        e.titre?.toLowerCase().includes(q) || 
        e.categorie?.toLowerCase().includes(q) || 
        e.lieu?.toLowerCase().includes(q)
      );
    }
    
    // Filtre Catégorie
    if (categorie) {
      r = r.filter(e => e.categorie === categorie);
    }

    // Tri (Récents / Anciens)
    r.sort((a, b) => tri === 'recent' 
      ? new Date(b.date) - new Date(a.date) 
      : new Date(a.date) - new Date(b.date)
    );
    
    return r;
  }, [events, search, categorie, tri]);

  // Styles dynamiques
  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    card: dark ? 'bg-[#0f0e1a] border-[#ffffff_0.05]' : 'bg-white border-gray-100 shadow-sm',
    glass: dark ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-md border-gray-200',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#161527] border-white/10' : 'bg-slate-50 border-slate-200'
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme.bg}`}>

      {/* --- HERO SECTION PREMIUM --- */}
      <section className="relative h-[35vh] md:h-[40vh] min-h-[300px] md:min-h-[350px] flex items-center overflow-hidden">
        <img src="/fond ecran evenement.jpg" alt="" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#080812]" />
        
        {/* Orbes décoratifs */}
        <div className="absolute -top-24 -left-24 w-64 md:w-96 h-64 md:h-96 bg-[#6c47ff]/20 rounded-full blur-[80px] md:blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-56 md:w-80 h-56 md:h-80 bg-[#00d4aa]/10 rounded-full blur-[60px] md:blur-[80px]" />

        <div ref={heroRef} className={`relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-16 md:pt-20 transition-all duration-1000 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-1.5 md:gap-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full px-3 md:px-4 py-1.5 md:py-2 mb-4 md:mb-6">
            <Sparkles size={12} className="text-[#f5a623] md:w-3.5 md:h-3.5" />
            <span className="text-white text-[8px] md:text-[10px] font-black tracking-[0.2em] uppercase">Expériences Uniques</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-3 md:mb-4 leading-tight">
            EXPLOREZ LES <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">ÉVÉNEMENTS.</span>
          </h1>
          <p className="text-white/50 text-sm md:text-lg font-medium max-w-lg">
            Découvrez la crème de la culture et du divertissement, triée sur le volet pour vous.
          </p>
        </div>
      </section>

      {/* --- FILTRES & NAVIGATION --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -translate-y-8 md:-translate-y-10 relative z-20">
        
        {/* Search Bar "Glass Skin" */}
        <div className={`flex flex-col lg:flex-row gap-2 md:gap-4 p-2 md:p-3 rounded-3xl md:rounded-[2.5rem] border shadow-2xl ${theme.glass}`}>
          <div className="flex-1 flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2 md:py-3">
            <Search className="w-4 h-4 md:w-5 md:h-5 text-[#6c47ff] shrink-0" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Titre, ville, artiste..."
              className="flex-1 bg-transparent text-sm md:text-base font-bold focus:outline-none placeholder:opacity-50 truncate" 
            />
            {search && <button onClick={() => setSearch('')} className="p-1 hover:bg-red-500/10 rounded-full text-red-500 transition"><X size={16} className="md:w-[18px] md:h-[18px]" /></button>}
          </div>

          <div className="h-px lg:w-px lg:h-8 bg-gray-500/20 self-center hidden lg:block" />

          <div className="flex items-center justify-between lg:justify-start gap-4 px-4 py-2 lg:py-0 border-t lg:border-t-0 border-gray-500/10">
            <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest opacity-50">
              <SlidersHorizontal size={12} className="md:w-3.5 md:h-3.5" /> Trier par
            </div>
            <select 
              value={tri} 
              onChange={(e) => setTri(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-black focus:outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="recent">Récents</option>
              <option value="ancien">Anciens</option>
            </select>
          </div>
        </div>

        {/* Catégories Pills */}
        <div className="flex gap-2 md:gap-3 flex-wrap mt-6 md:mt-8">
          <button 
            onClick={() => setCategorie('')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all ${!categorie ? 'bg-[#6c47ff] text-white shadow-xl shadow-[#6c47ff]/30 scale-105' : `border ${theme.card} ${theme.sub} hover:border-[#6c47ff] hover:text-[#6c47ff]`}`}
          >
            TOUS LES FLUX
          </button>
          {categories.map((cat) => {
            const count = events.filter(e => e.categorie === cat).length; // 👈 Utilise le state local `events`
            if (!count) return null;
            return (
              <button 
                key={cat} 
                onClick={() => setCategorie(categorie === cat ? '' : cat)}
                className={`flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black border transition-all ${categorie === cat ? 'bg-[#6c47ff] text-white shadow-xl shadow-[#6c47ff]/30 scale-105' : `${theme.card} ${theme.sub} hover:border-[#6c47ff] hover:text-[#6c47ff]`}`}
              >
                <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${categorie === cat ? 'bg-white' : CATEGORY_COLORS[cat].bg}`} />
                {cat.toUpperCase()}
                <span className={`ml-0.5 md:ml-1 opacity-50 text-[8px] md:text-[10px]`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Results Info */}
        {search && (
          <div className={`mt-6 md:mt-8 flex items-center gap-3 md:gap-4 ${theme.sub}`}>
            <span className="h-px flex-1 bg-gray-500/10"></span>
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
              {filtered.length} Résultat{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
            </p>
            <span className="h-px flex-1 bg-gray-500/10"></span>
          </div>
        )}

        {/* --- GRID ÉVÉNEMENTS --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 gap-4">
            <Spinner size="lg" />
            <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest animate-pulse ${theme.sub}`}>Chargement du catalogue...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`mt-8 md:mt-12 text-center py-20 md:py-32 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed ${theme.card} border-white/5`}>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Search className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
            </div>
            <p className={`text-lg md:text-xl font-black mb-2 ${theme.text}`}>Aucun match trouvé</p>
            <p className={`text-xs md:text-sm ${theme.sub}`}>Ajustez vos filtres pour découvrir d'autres pépites.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 mt-8 md:mt-12 pb-16 md:pb-24">
            {filtered.map((event) => {
              const catStyle = CATEGORY_COLORS[event.categorie] || CATEGORY_COLORS.Autre;
              return (
                <Link 
                  key={event.id || event._id} 
                  to={`/events/${event.id || event._id}`}
                  className={`group relative rounded-[1.5rem] md:rounded-[2.5rem] border overflow-hidden transition-all duration-500 hover:-translate-y-2 md:hover:-translate-y-3 hover:shadow-2xl ${theme.card}`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img 
                      src={event.image || '/api/placeholder/400/500'} 
                      alt={event.titre} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-transparent to-transparent opacity-80" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5 md:gap-2">
                      <span className={`flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black px-2.5 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md bg-white/10 text-white border border-white/20 shadow-xl`}>
                        <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${catStyle.bg}`} />
                        {event.categorie?.toUpperCase() || 'AUTRE'}
                      </span>
                      {event.vote_actif && (
                        <span className="bg-[#f5a623] text-black text-[8px] md:text-[9px] font-black px-2.5 py-1 md:px-4 md:py-1.5 rounded-full shadow-lg animate-pulse w-max">
                          VOTE EN COURS
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4">
                       <p className="text-white/60 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">À partir de</p>
                       <p className="text-xl md:text-2xl font-black text-[#f5a623] drop-shadow-2xl">
                        {event.tickets?.[0]?.prix ? `${event.tickets[0].prix.toLocaleString()} F` : 'Gratuit'}
                       </p>
                    </div>
                  </div>

                  {/* Body Container */}
                  <div className="p-4 md:p-6">
                    <h3 className={`text-base md:text-lg font-black leading-tight mb-3 md:mb-4 line-clamp-2 h-10 md:h-12 ${theme.text} group-hover:text-[#6c47ff] transition-colors`}>
                      {event.titre?.toUpperCase()}
                    </h3>

                    <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                      <div className={`flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-bold ${theme.sub}`}>
                        <div className="p-1.5 md:p-2 rounded-lg bg-gray-500/10"><Calendar size={12} className="md:w-3.5 md:h-3.5 text-[#6c47ff]" /></div>
                        {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className={`flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-bold ${theme.sub}`}>
                        <div className="p-1.5 md:p-2 rounded-lg bg-gray-500/10"><MapPin size={12} className="md:w-3.5 md:h-3.5 text-[#00d4aa]" /></div>
                        <span className="truncate">{event.lieu}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                       <button className="flex-1 bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white text-[9px] md:text-[10px] font-black py-3 md:py-4 rounded-xl md:rounded-2xl shadow-lg shadow-[#6c47ff]/20 group-hover:shadow-[#6c47ff]/40 transition-all flex items-center justify-center gap-1.5 md:gap-2">
                        RÉSERVER <ArrowUpRight size={12} className="md:w-3.5 md:h-3.5" />
                       </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}