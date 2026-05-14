import { useEffect, useState, useMemo, useRef, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import Spinner from '../components/ui/Spinner';
import { Calendar, MapPin, Search, X, Sparkles } from 'lucide-react';

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
  Concert: 'bg-[#6c47ff]', Conference: 'bg-[#0ea5e9]', Sport: 'bg-[#00d4aa]',
  Festival: 'bg-[#f5a623]', Concours: 'bg-[#e84393]', Autre: 'bg-gray-500',
};
const CATEGORIES_LIST = ['Concert', 'Conference', 'Sport', 'Festival', 'Concours', 'Autre'];

const EventCard = memo(({ event, theme }) => (
  <Link
    to={`/events/${event.id}`}
    className={`group rounded-[1.5rem] overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
  >
    <div className="relative aspect-[4/5] bg-slate-800 overflow-hidden">
      <img
        src={event.image || '/placeholder.webp'}
        alt={event.titre}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        decoding="async"
        width="400"
        height="500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute top-3 left-3">
        <span className="bg-black/70 backdrop-blur-md text-white text- font-black px-2.5 py-1 rounded-md flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[event.categorie] || CATEGORY_COLORS.Autre}`} />
          {event.categorie?.toUpperCase()}
        </span>
      </div>
    </div>

    <div className="p-4">
      <h3 className={`text- font-black leading-tight mb-3 line-clamp-2 h-10 ${theme.text}`}>
        {event.titre}
      </h3>
      <div className="space-y-1.5">
        <div className={`flex items-center gap-2 text- font-bold ${theme.sub}`}>
          <Calendar size={13} className="text-[#6c47ff] shrink-0" />
          {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </div>
        <div className={`flex items-center gap-2 text- font-bold ${theme.sub}`}>
          <MapPin size={13} className="text-[#00d4aa] shrink-0" />
          <span className="truncate">{event.lieu}</span>
        </div>
      </div>
    </div>
  </Link>
));

export default function EventsPage() {
  const [searchParams] = useSearchParams();
  const { dark } = useSelector((s) => s.theme);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [categorie, setCategorie] = useState('');
  const [tri, setTri] = useState('recent');
  const [heroRef, heroInView] = useInView();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
       .from('events')
       .select('id, titre, categorie, lieu, date, image')
       .eq('statut', 'validé')
       .order('date', { ascending: false })
       .limit(60);
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = {};
    events.forEach(e => { counts[e.categorie] = (counts[e.categorie] || 0) + 1; });
    return counts;
  }, [events]);

  const filtered = useMemo(() => {
    let r = events;
    if (categorie) r = r.filter(e => e.categorie === categorie);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      r = r.filter(e => e.titre?.toLowerCase().includes(q) || e.lieu?.toLowerCase().includes(q));
    }
    return tri === 'recent'? r : [...r].reverse();
  }, [events, debouncedSearch, categorie, tri]);

  const handleCat = useCallback((cat) => setCategorie(c => c === cat? '' : cat), []);

  const theme = {
    bg: dark? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    card: dark? 'bg-[#0f0e1a] border-white/10' : 'bg-white border-gray-100',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-500',
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <section className="relative h- md:h- flex items-center overflow-hidden bg-slate-900">
        <img src="/fond-ecran.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" fetchpriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080812] to-transparent" />
        <div ref={heroRef} className={`relative z-10 max-w-7xl mx-auto px-6 transition-opacity duration-500 ${heroInView? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
            <Sparkles size={12} className="text-[#f5a623]" />
            <span className="text-white text- font-black tracking-widest">EXPÉRIENCES</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            NOS <span className="text-[#00d4aa]">ÉVÉNEMENTS</span>
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-20">
        <div className={`flex flex-col lg:flex-row gap-2 p-2 rounded-2xl border backdrop-blur-xl ${theme.card}`}>
          <div className="flex-1 flex items-center gap-3 px-4">
            <Search size={18} className="text-[#6c47ff] shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent py-3 text-sm font-medium focus:outline-none"
            />
            {search && <button onClick={() => setSearch('')}><X size={16} className="text-slate-400" /></button>}
          </div>
          <select value={tri} onChange={e => setTri(e.target.value)} className="bg-transparent px-4 py-3 text-sm font-bold focus:outline-none cursor-pointer">
            <option value="recent">Plus récents</option>
            <option value="ancien">Plus anciens</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap mt-5">
          <button onClick={() => setCategorie('')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${!categorie? 'bg-[#6c47ff] text-white' : theme.card}`}>
            TOUT
          </button>
          {CATEGORIES_LIST.map(cat => {
            const count = categoryCounts[cat] || 0;
            if (!count) return null;
            return (
              <button
                key={cat}
                onClick={() => handleCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${categorie === cat? 'bg-[#6c47ff] text-white border-transparent' : theme.card}`}
              >
                {cat} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {loading? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8 pb-20">
            {filtered.map(event => <EventCard key={event.id} event={event} theme={theme} />)}
          </div>
        )}
      </div>
    </div>
  );
}