import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient'; 
import Spinner from '../components/ui/Spinner';
import { 
  Calendar, Search, ChevronDown, 
  ArrowRight, X, Users, Sparkles, ShieldCheck, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Hook pour les animations d'entrée fluides
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Design System : 12 Thèmes génératifs pour les cartes Organisateurs
const COVERS = [
  { bg_start: '#0d0221', bg_end: '#1a0533', accent: '#6c47ff', border: 'rgba(108,71,255,0.3)' },
  { bg_start: '#001a2c', bg_end: '#003554', accent: '#0ea5e9', border: 'rgba(14,165,233,0.3)' },
  { bg_start: '#001a1a', bg_end: '#003333', accent: '#00d4aa', border: 'rgba(0,212,170,0.3)' },
  { bg_start: '#1a0a28', bg_end: '#2d1045', accent: '#8b5cf6', border: 'rgba(139,92,246,0.3)' },
  { bg_start: '#0a1628', bg_end: '#0f2744', accent: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  { bg_start: '#1a0a14', bg_end: '#3d1028', accent: '#e84393', border: 'rgba(232,67,147,0.3)' },
  { bg_start: '#1a1000', bg_end: '#3d2800', accent: '#f5a623', border: 'rgba(245,166,35,0.3)' },
  { bg_start: '#001a10', bg_end: '#003320', accent: '#10b981', border: 'rgba(16,185,129,0.3)' },
  { bg_start: '#1a0808', bg_end: '#3d1010', accent: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  { bg_start: '#0a0a1a', bg_end: '#14143d', accent: '#6366f1', border: 'rgba(99,102,241,0.3)' },
  { bg_start: '#001818', bg_end: '#003030', accent: '#06b6d4', border: 'rgba(6,182,212,0.3)' },
  { bg_start: '#180a1a', bg_end: '#38103d', accent: '#d946ef', border: 'rgba(217,70,239,0.3)' },
];

export default function OrganisateursPage() {
  const { dark } = useSelector((s) => s.theme);
  const [organisateurs, setOrganisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tri, setTri] = useState('recent');
  const [page, setPage] = useState(1);
  const [heroRef, heroInView] = useInView(0.05);
  const PER_PAGE = 12;

  useEffect(() => {
    const fetchOrganisateurs = async () => {
      try {
        // --- LOGIQUE SUPABASE ---
        // On récupère uniquement les utilisateurs avec le rôle 'organisateur'
        // et qui ont le compte actif (is_active)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'organisateur')
          .eq('isActive', true) // Sécurité additionnelle
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrganisateurs(data || []);

      } catch (err) {
        console.error("Erreur lors de la récupération des organisateurs:", err.message);
        toast.error("Impossible de charger les organisateurs.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganisateurs();
  }, []);

  const filtered = useMemo(() => {
    let r = [...organisateurs];
    
    // Filtre de recherche
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((o) => o.nom?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q));
    }
    
    // Tris
    if (tri === 'recent') r.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (tri === 'ancien') r.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (tri === 'az') r.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
    
    return r;
  }, [organisateurs, search, tri]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Thème Premium
  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0f0e1a] border-[#ffffff_0.05]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/40',
    input: dark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme.bg}`}>

      {/* --- HERO SECTION XXL --- */}
      <section className="relative h-[40vh] min-h-[350px] flex items-center overflow-hidden">
        <img src="/fond ecran evenement.jpg" alt="Fond" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080812]/90 via-[#080812]/60 to-[#080812]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#6c47ff]/20 to-[#00d4aa]/10" />
        
        {/* Orbes */}
        <div className="absolute -top-20 right-10 w-[500px] h-[500px] bg-[#6c47ff]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] bg-[#f5a623]/10" />

        <div
          ref={heroRef}
          className={`relative z-10 max-w-7xl mx-auto px-6 pt-20 text-center transition-all duration-1000 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2 mb-6 mx-auto shadow-xl">
            <Star size={14} className="text-[#f5a623]" />
            <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase">Réseau d'Excellence</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-4 leading-tight">
            LES CRÉATEURS <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] via-[#9d84ff] to-[#00d4aa]">D'EXPÉRIENCES.</span>
          </h1>
          
          <p className="text-white/60 text-lg font-medium max-w-xl mx-auto mb-8">
            Découvrez les promoteurs et organisateurs qui donnent vie aux meilleurs événements sur TickoFiesta.
          </p>

          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-4 shadow-2xl">
            <Users size={24} className="text-[#00d4aa]" />
            <div className="text-left">
              <p className="text-2xl font-black text-white leading-none">{organisateurs.length}</p>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-1">Organisateurs</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTENT SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 py-16 -mt-10 relative z-20">

        {/* --- BARRE DE RECHERCHE (Glass Skin) --- */}
        <div className={`flex flex-col sm:flex-row gap-4 p-3 rounded-[2rem] border shadow-2xl mb-12 ${dark ? 'bg-[#0f0e1a]/80 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-gray-200'}`}>
          <div className="flex-1 flex items-center gap-4 px-6 py-3">
            <Search size={20} className="text-[#6c47ff]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher par nom, label..."
              className={`flex-1 bg-transparent text-sm font-bold focus:outline-none placeholder:opacity-50 ${dark ? 'text-white' : 'text-gray-900'}`}
            />
            {search && (
              <button onClick={() => setSearch('')} className="p-1 hover:bg-red-500/10 rounded-full text-red-500 transition">
                <X size={18} />
              </button>
            )}
          </div>
          
          <div className="hidden sm:block w-px bg-gray-500/20 my-2" />

          <div className="relative px-2">
            <select
              value={tri}
              onChange={(e) => { setTri(e.target.value); setPage(1); }}
              className={`w-full sm:w-auto appearance-none bg-transparent rounded-xl px-6 py-4 pr-10 text-xs font-black uppercase tracking-widest focus:outline-none cursor-pointer ${dark ? 'text-white/80' : 'text-gray-600'}`}
            >
              <option value="recent">Plus Récents</option>
              <option value="ancien">Plus Anciens</option>
              <option value="az">Alphabétique (A-Z)</option>
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
          </div>
        </div>

        {/* --- RÉSULTATS --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Spinner size="lg" />
            <p className={`text-xs font-black uppercase tracking-widest animate-pulse ${theme.sub}`}>Recherche des créateurs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-32 rounded-[3rem] border-2 border-dashed ${dark ? 'border-white/5 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
            <div className="w-20 h-20 rounded-full bg-[#6c47ff]/10 flex items-center justify-center mx-auto mb-6">
              <Users size={32} className="text-[#6c47ff] opacity-50" />
            </div>
            <p className={`text-xl font-black mb-2 ${theme.text}`}>Aucun organisateur trouvé</p>
            <p className={`text-sm ${theme.sub}`}>Essayez de modifier vos termes de recherche.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
              {paginated.map((org, i) => {
                const cover = COVERS[i % COVERS.length];
                const initial = org.nom?.charAt(0)?.toUpperCase() || 'O';

                return (
                  <Link
                    key={org.id} // Supabase ID
                    to={`/organisateurs/${org.id}?c=${encodeURIComponent(JSON.stringify({ bg_start: cover.bg_start, bg_end: cover.bg_end, accent: cover.accent }))}`}
                    className={`group relative rounded-[2rem] border overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-slide-up ${dark ? 'bg-[#0f0e1a]' : 'bg-white'}`}
                    style={{ borderColor: dark ? cover.border : 'rgba(0,0,0,0.05)' }}
                  >
                    {/* Zone Haute (Gradients & Orbes) */}
                    <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(160deg, ${cover.bg_start}, ${cover.bg_end})` }}>
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700" style={{ background: cover.accent }} />
                      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full blur-xl opacity-30 group-hover:scale-150 transition-transform duration-700" style={{ background: cover.accent }} />
                      
                      {/* Badge Vérifié Premium (Assure-toi que cette colonne existe ou adapte) */}
                      {org.is_verified && (
                        <div className="absolute top-4 right-4">
                          <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/30 shadow-lg">
                            <ShieldCheck size={12} className="text-[#00d4aa]" /> Vérifié
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Zone Contenu */}
                    <div className="px-6 pb-6 relative">
                      {/* Avatar Flottant */}
                      <div 
                        className="relative w-16 h-16 rounded-2xl -mt-8 mb-4 flex items-center justify-center shadow-2xl border-[3px] border-[#080812] overflow-hidden bg-[#080812] group-hover:scale-105 transition-transform"
                      >
                        {org.logo || org.image ? (
                           <img src={org.logo || org.image} alt={org.nom} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="absolute inset-0" style={{ background: `${cover.accent}33` }} />
                            <span className="text-white font-black text-2xl relative z-10">{initial}</span>
                          </>
                        )}
                      </div>
                      
                      <h3 className={`font-black text-lg line-clamp-1 mb-1 transition-colors ${theme.text} group-hover:text-[${cover.accent}]`}>
                        {org.nom?.toUpperCase()}
                      </h3>
                      
                      <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-6 ${theme.sub}`}>
                        <Calendar size={12} />
                        Créé en {new Date(org.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </p>
                      
                      {/* Action Bas de Carte */}
                      <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.sub}`}>Visiter le profil</span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: `${cover.accent}15`, color: cover.accent }}>
                           <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* --- PAGINATION PREMIUM --- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mb-16">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${dark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  <ArrowRight size={16} className="rotate-180" />
                </button>
                
                <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        p === page
                          ? 'bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white shadow-lg shadow-[#6c47ff]/40 scale-110'
                          : `text-gray-400 hover:text-white hover:bg-white/10`
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${dark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {/* --- CALL TO ACTION (Devenir Organisateur) --- */}
        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#6c47ff] via-[#8b6bff] to-[#00d4aa] transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-20%] right-[10%] w-[300px] h-[300px] rounded-full bg-white blur-[80px]" />
            <div className="absolute bottom-[-20%] left-[10%] w-[400px] h-[400px] rounded-full bg-white blur-[100px]" />
          </div>
          
          <div className="relative z-10 px-6 py-16 md:py-20 text-center text-white flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 shadow-2xl border border-white/30">
               <Sparkles size={32} className="text-white" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
              VOUS ORGANISEZ DES ÉVÉNEMENTS ?
            </h2>
            <p className="text-white/80 text-sm md:text-base font-medium max-w-xl mx-auto mb-10 leading-relaxed">
              Rejoignez le réseau d'excellence. Digitalisez votre billetterie, créez des concours de votes et touchez des milliers de participants.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Link
                to="/register?role=organisateur"
                className="bg-[#f5a623] hover:bg-[#fbbf24] text-black font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#f5a623]/30 hover:-translate-y-1 hover:shadow-[#f5a623]/50"
              >
                Devenir Organisateur <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="border-2 border-white/30 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-md hover:-translate-y-1"
              >
                Espace Connexion
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}