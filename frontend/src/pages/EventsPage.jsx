import { useEffect, useState, useMemo, memo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import Spinner from '../components/ui/Spinner';
import { Calendar, MapPin, Search, Filter, Sparkles } from 'lucide-react';

const CATEGORIES_LIST = ['Concert', 'Conference', 'Sport', 'Festival', 'Concours', 'Autre'];

// Composant EventCard mis à jour avec le Social Proof
const EventCard = memo(({ event, theme, dark }) => {
  // Génération d'un nombre pseudo-aléatoire mais fixe pour chaque événement (Social Proof)
  const fakeParticipantsCount = (event.titre?.length || 10) * 12 + 150;

  return (
    <Link
      to={`/events/${event.slug || event.id}`}
      className={`group relative rounded-[2rem] overflow-hidden border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col ${theme.card}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden shrink-0">
        <img
          src={event.image || '/placeholder.webp'}
          alt={event.titre}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="bg-white/10 backdrop-blur-lg text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
            {event.categorie}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className={`text-[15px] font-black leading-snug mb-4 line-clamp-2 ${theme.text}`}>
          {event.titre}
        </h3>
        
        <div className="flex flex-col gap-2.5 mb-4">
          <div className={`flex items-center gap-2 text-xs font-semibold ${theme.sub}`}>
            <Calendar size={14} className="text-[#6c47ff]" />
            {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </div>
          <div className={`flex items-center gap-2 text-xs font-semibold ${theme.sub}`}>
            <MapPin size={14} className="text-[#00d4aa]" />
            <span className="truncate">{event.lieu}</span>
          </div>
        </div>

        {/* --- NOUVEAU : BLOC SOCIAL PROOF --- */}
        <div className={`mt-auto pt-4 border-t flex items-center justify-between ${dark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex -space-x-2">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces" className={`w-6 h-6 rounded-full border-2 ${dark ? 'border-[#0b0a1a]' : 'border-white'} object-cover`} alt="Participant" />
            <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&crop=faces" className={`w-6 h-6 rounded-full border-2 ${dark ? 'border-[#0b0a1a]' : 'border-white'} object-cover`} alt="Participant" />
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces" className={`w-6 h-6 rounded-full border-2 ${dark ? 'border-[#0b0a1a]' : 'border-white'} object-cover`} alt="Participant" />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.sub}`}>
            +{fakeParticipantsCount} intéressés
          </span>
        </div>
        {/* ----------------------------------- */}

      </div>
    </Link>
  );
});

export default function EventsPage() {
  const [searchParams] = useSearchParams();
  const { dark } = useSelector((s) => s.theme);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categorie, setCategorie] = useState('');
  const [tri, setTri] = useState('recent');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('statut', ['validé', 'valide', 'Validé', 'Valide', 'VALIDE'])
        .order('date', { ascending: false });

      if (error) {
        console.error("Erreur chargement événements:", error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filtered = useMemo(() => {
    let r = events;
    if (categorie) r = r.filter(e => e.categorie === categorie);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(e => e.titre?.toLowerCase().includes(q) || e.lieu?.toLowerCase().includes(q));
    }
    return tri === 'recent' ? r : [...r].reverse();
  }, [events, search, categorie, tri]);

  const theme = {
    bg: dark ? 'bg-[#050507]' : 'bg-slate-50',
    card: dark ? 'bg-[#0b0a1a] border-white/5' : 'bg-white border-slate-100',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  };

  return (
    <div className={`min-h-screen pb-20 ${theme.bg}`}>
      <header className="relative py-16 px-6 bg-[#050812] border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center text-xs font-bold text-white/50 hover:text-white mb-8 transition-colors">
            ← RETOUR
          </Link>
          <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 text-[#00d4aa] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-[#00d4aa]/20">
            <Sparkles size={10} /> Réservation ouverte
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            NOS ÉVÉNEMENTS
          </h1>
          <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
            <MapPin size={14} /> Abidjan, Côte d'Ivoire
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-12">
        <div className={`flex flex-col md:flex-row gap-4 p-3 rounded-[1.5rem] border backdrop-blur-xl shadow-xl ${theme.card}`}>
          <div className="flex-1 flex items-center gap-3 px-4">
            <Search size={18} className="text-[#6c47ff]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un événement..."
              className="w-full bg-transparent py-3 text-sm font-bold focus:outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-800/20 px-4">
            <Filter size={16} className="text-slate-500" />
            <select value={tri} onChange={e => setTri(e.target.value)} className="bg-transparent py-3 text-sm font-bold focus:outline-none cursor-pointer">
              <option value="recent">Plus récents</option>
              <option value="ancien">Plus anciens</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-8 mb-12">
          <button onClick={() => setCategorie('')} className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${!categorie ? 'bg-[#6c47ff] text-white' : 'bg-white/5 hover:bg-white/10'}`}>Tout</button>
          {CATEGORIES_LIST.map(cat => (
            <button key={cat} onClick={() => setCategorie(cat)} className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${categorie === cat ? 'bg-[#6c47ff] text-white' : 'bg-white/5 hover:bg-white/10'}`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map(event => <EventCard key={event.id} event={event} theme={theme} dark={dark} />)}
          </div>
        ) : (
            <div className={`text-center py-20 ${theme.sub}`}>Aucun événement trouvé.</div>
        )}
      </main>
    </div>
  );
}