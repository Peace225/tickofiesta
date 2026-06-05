import { Search, Loader2, Calendar, Users, Star } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../config/supabaseClient"; 

export default function HeroSection({ heroRef, stats }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({ events: [], votes: [], candidats: [], cagnottes: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length < 2) {
        setResults({ events: [], votes: [], candidats: [], cagnottes: [] });
        setShowDropdown(false);
        return;
      }
      setIsSearching(true);
      setShowDropdown(true);

      try {
        const q = `%${searchQuery}%`;
        
        // CORRECTION CRUCIALE : 
        // Utilisation des noms de colonnes exacts vus dans vos captures d'écran.
        const [ev, vt, cand, cag] = await Promise.all([
          supabase.from('events').select('id, slug, titre').ilike('titre', q).limit(3),
          supabase.from('votes').select('id, slug, title').ilike('title', q).limit(3),
          supabase.from('candidats').select('id, vote_id, nom').ilike('nom', q).limit(3),
          supabase.from('cagnottes').select('id, slug, titre').ilike('titre', q).limit(3)
        ]);

        setResults({ 
          events: ev.data || [], 
          votes: vt.data || [], 
          candidats: cand.data || [], 
          cagnottes: cag.data || [] 
        });
      } catch (error) { 
        console.error("Erreur recherche:", error); 
      } finally { 
        setIsSearching(false); 
      }
    };
    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const hasResults = results.events.length > 0 || results.votes.length > 0 || results.candidats.length > 0 || results.cagnottes.length > 0;

  return (
    <section ref={heroRef} className="relative w-full min-h-[450px] md:min-h-[550px] flex items-center justify-center bg-gradient-to-r from-[#2e1065] via-[#5b21b6] to-[#1e1b4b] pt-10 pb-16 z-[50]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-500/20 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-[100] w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-sm">
          <span className="text-[#e65c00] text-sm">⭐</span>
          <span className="text-white text-[10px] md:text-xs font-bold tracking-wider uppercase">
            {stats && stats.length >= 2 ? `${stats[0]?.val} ${stats[0]?.label} - ${stats[1]?.val} ${stats[1]?.label}` : '6 ÉVÉNEMENTS - 1 VOTE ACTIF'}
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">Ne ratez plus rien !</h1>
        <p className="text-sm md:text-lg text-purple-200/90 mb-8 max-w-2xl font-medium">
          Billetterie d'événements, votes de candidats, réservation de stands et cagnottes en ligne. Vivez l'expérience complète et participez avant qu'il ne soit trop tard !
        </p>

        <div ref={searchRef} className="relative w-full max-w-2xl mb-8 z-[100]">
          <div className="bg-white rounded-full p-2 flex items-center shadow-2xl transition-transform">
            <Search className="ml-4 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
              placeholder="Rechercher événements, concours, candidats..."
              className="flex-1 bg-transparent outline-none px-4 text-gray-800 h-12"
            />
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-[1000] p-4 max-h-[400px] overflow-y-auto text-left border border-gray-100">
              {isSearching ? <div className="text-center p-4"><Loader2 className="animate-spin mx-auto text-[#e65c00]" /></div> : (
                <>
                  {results.events.length > 0 && <ResultGroup title="Événements" items={results.events} link="/events/" field="titre" />}
                  {results.votes.length > 0 && <ResultGroup title="Concours" items={results.votes} link="/votes/" field="title" />}
                  {results.candidats.length > 0 && <ResultGroup title="Candidats" items={results.candidats} link="/votes/" field="nom" />}
                  {results.cagnottes.length > 0 && <ResultGroup title="Cagnottes" items={results.cagnottes} link="/cagnottes/" field="titre" />}
                  {!hasResults && searchQuery.length >= 2 && <p className="text-center text-gray-500 py-4 text-sm">Aucun résultat trouvé.</p>}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <div className="flex -space-x-3">
            <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=64&h=64&fit=crop&crop=faces" className="w-10 h-10 rounded-full border-2 border-[#2e1065] object-cover shadow-lg" alt="User" />
            <div className="w-10 h-10 rounded-full border-2 border-[#2e1065] bg-[#e65c00] flex items-center justify-center shadow-lg relative z-10">
              <span className="text-white text-[10px] font-black">+15k</span>
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-[#e65c00] text-[#e65c00]" />)}
            </div>
            <p className="text-white/90 text-xs font-bold">Utilisateurs actifs en CI</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const ResultGroup = ({ title, items, link, field }) => (
  <div className="mb-4">
    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{title}</h3>
    {items.map(item => (
      <Link key={item.id} to={`${link}${item.slug || item.id}`} className="block p-2 hover:bg-gray-100 rounded-lg text-sm font-bold text-gray-700">
        {item[field]}
      </Link>
    ))}
  </div>
);