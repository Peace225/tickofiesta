import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  MapPin, CheckCircle, Share2, Copy, User,
  ArrowLeft, MessageCircle, AlertCircle, ChevronRight, Activity
} from 'lucide-react';

// --- UTILITAIRES ---
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('vote-images').getPublicUrl(path);
  return data.publicUrl;
};

// --- COMPOSANT COMPTEUR ANIMÉ ---
const AnimatedCounter = ({ end }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = count;
    const duration = 1500;
    const stepTime = Math.abs(Math.floor(duration / (end - start || 1)));
    
    if (start === end) return;

    const timer = setInterval(() => {
      start += (end > start ? 1 : -1);
      setCount(start);
      if (start === end) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [end]);
  return <span>{count}</span>;
};

// --- COMPOSANT COUNTDOWN ---
function CountdownBadge({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, ended: false });

  useEffect(() => {
    if (!endDate) return;
    const timer = setInterval(() => {
      const diff = new Date(endDate) - new Date();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, ended: true });
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.ended) return <div className="text-sm md:text-3xl font-black text-white tracking-widest uppercase">Terminé</div>;

  return (
    <div className="flex items-center gap-1 text-sm md:text-3xl font-black text-white tracking-tighter md:tracking-widest drop-shadow-lg">
      <span>{timeLeft.d}j</span>
      <span className="text-blue-400">:</span>
      <span>{timeLeft.h.toString().padStart(2, '0')}h</span>
      <span className="text-blue-400">:</span>
      <span>{timeLeft.m.toString().padStart(2, '0')}m</span>
      <span className="text-blue-400">:</span>
      <span>{timeLeft.s.toString().padStart(2, '0')}s</span>
    </div>
  );
}

// --- COMPOSANT CARTE DE VOTE ---
function VoteCard({ vote, past = false }) {
  const coverImage = getImageUrl(vote.image_url || vote.image);
  const linkTarget = `/votes/${vote.slug || vote.id}`;
  
  // Logique du Social Proof : On prend max 3 candidats pour l'affichage visuel
  const candidats = vote.candidats || [];
  const previewCandidats = candidats.slice(0, 3);
  const remainingCandidats = Math.max(0, candidats.length - 3);

  return (
    <Link 
      to={linkTarget}
      className={`group relative flex flex-col justify-between rounded-xl md:rounded-[20px] p-3 md:p-5 overflow-hidden border border-[#2a304d] hover:border-blue-500 transition-all min-h-[160px] md:min-h-[220px] shadow-lg ${past ? 'opacity-75 grayscale hover:grayscale-0' : ''}`}
    >
      <div className="absolute inset-0 z-0 bg-[#0f1225]">
        {coverImage ? (
          <img src={coverImage} alt={vote.titre} className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1e36] to-[#0f1225]" />
        )}
        {/* DÉGRADÉ RENFORCÉ : Plus sombre en bas pour que le titre blanc soit toujours lisible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050812] via-[#050812]/70 to-transparent opacity-90" />
      </div>

      <div className="mb-2 md:mb-4 relative z-10">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest ${past ? 'bg-white/10 text-white/50 backdrop-blur-sm' : 'bg-[#10b981] text-white shadow-lg'}`}>
          {!past && <span className="w-1 h-1 bg-white rounded-full animate-pulse" />}
          {past ? 'Terminé' : 'Ouvert'}
        </span>
      </div>

      {/* TITRE RENDU VISIBLE */}
      <div className="relative z-10 mt-1 mb-auto">
        <p className="text-[#00d4aa] text-[7px] md:text-[10px] font-black uppercase tracking-[0.15em] mb-1 drop-shadow-md">
          {vote.categorie || 'AWARDS'}
        </p>
        {/* Ajout d'une ombre portée forte sur le texte pour le détacher de l'image */}
        <h3 className="text-sm md:text-xl font-black text-white leading-tight mb-2 md:mb-4 line-clamp-2 drop-shadow-[0_3px_3px_rgba(0,0,0,0.8)]">
          {vote.titre}
        </h3>
      </div>

      {/* PIED DE CARTE : SOCIAL PROOF ET BOUTON */}
      <div className="flex items-end justify-between mt-auto relative z-10 pt-2 border-t border-white/10">
        
        {/* SOCIAL PROOF : Avatars superposés */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {previewCandidats.map((c, i) => (
              <div key={c.id || i} className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-[#2a304d] bg-slate-800 overflow-hidden z-10 shadow-sm">
                {(c.photo_url || c.image) ? (
                  <img src={getImageUrl(c.photo_url || c.image)} alt="Candidat" className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="w-full h-full p-1.5 text-slate-400" />
                )}
              </div>
            ))}
            {remainingCandidats > 0 && (
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-[#2a304d] bg-slate-800 flex items-center justify-center z-10 shadow-sm">
                <span className="text-[7px] md:text-[9px] font-bold text-white">+{remainingCandidats}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-[9px] md:text-[11px] leading-none">{candidats.length}</span>
            <span className="text-white/50 font-medium text-[7px] md:text-[9px] uppercase tracking-wider">Candidats</span>
          </div>
        </div>

        {/* BOUTON */}
        <div className="flex items-center">
          {!past ? (
            <div className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[9px] md:text-[11px] font-black uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1">
              Voter <ChevronRight size={12} />
            </div>
          ) : (
            <div className="bg-white/10 text-white/80 px-3 py-1.5 rounded-lg text-[9px] md:text-[11px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
              Voir <ChevronRight size={12} />
            </div>
          )}
        </div>
        
      </div>
    </Link>
  );
}

// --- PAGE PRINCIPALE ---
export default function VotesPage() {
  const navigate = useNavigate();
  const [actifs, setActifs] = useState([]);
  const [passes, setPasses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [globalStats, setGlobalStats] = useState({ candidats: 0, votes: 0 });
  const [recentActivity, setRecentActivity] = useState(false);

  const fetchVotes = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      // MODIFICATION CRITIQUE : On récupère la photo_url des candidats pour le Social Proof
      const { data, error } = await supabase
        .from('votes')
        .select('*, candidats(id, photo_url)') 
        .order('created_at', { ascending: false });

      if (error) throw error;

      const activeEvents = [];
      const pastEvents = [];
      const now = new Date();
      
      let totalCandidatsCount = 0;
      let fallbackVotesCount = 0; 

      (data || []).forEach(vote => {
        if (vote.statut?.toLowerCase() === 'brouillon') return;
        
        totalCandidatsCount += vote.candidats?.length || 0;
        fallbackVotesCount += vote.total_votes || 0; 

        const isClosedByStatus = vote.statut?.toLowerCase() === 'cloture';
        const isClosedByDate = vote.date_fin && new Date(vote.date_fin) < now;

        if (isClosedByStatus || isClosedByDate) {
          pastEvents.push(vote);
        } else {
          activeEvents.push(vote);
        }
      });

      setActifs(activeEvents);
      setPasses(pastEvents);

      try {
        const { count, error: countError } = await supabase
          .from('vote_logs')
          .select('*', { count: 'exact', head: true }); 
          
        if (!countError && count !== null) {
          setGlobalStats({ candidats: totalCandidatsCount, votes: count });
        } else {
          setGlobalStats({ candidats: totalCandidatsCount, votes: fallbackVotesCount });
        }
      } catch (e) {
        setGlobalStats({ candidats: totalCandidatsCount, votes: fallbackVotesCount });
      }

    } catch (err) {
      console.error("Détails de l'erreur:", err.message);
      toast.error("Impossible de charger les événements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotes(true);
    
    const votesChannel = supabase.channel('votes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchVotes(false))
      .subscribe();

    const logsChannel = supabase.channel('logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_logs' }, (payload) => {
        setGlobalStats(prev => ({ ...prev, votes: prev.votes + 1 }));
        setRecentActivity(true);
        setTimeout(() => setRecentActivity(false), 3000); 
      })
      .subscribe();
      
    return () => { 
      supabase.removeChannel(votesChannel); 
      supabase.removeChannel(logsChannel);
    };
  }, [fetchVotes]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent("Soutenez vos favoris sur la plateforme ! " + window.location.href)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4f7fe] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Chargement...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fe] pb-20 font-sans">
      <section className="bg-[#0b1129] relative overflow-hidden text-white pt-20 md:pt-24 pb-12 md:pb-16 px-4 md:px-8 shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1d4ed8 0%, transparent 50%)' }} />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 mb-4 text-[10px] font-black uppercase tracking-widest transition-colors"><ArrowLeft size={14} /> Retour</button>
            <div className="inline-flex items-center gap-1.5 bg-[#10b981] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"><span className="w-1 h-1 rounded-full bg-white animate-pulse" /> Vote ouvert</div>
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-2">CONCOURS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00d4aa]">EN LIGNE</span></h1>
            <p className="text-white/60 flex items-center gap-1.5 font-medium text-[12px] md:text-sm"><MapPin size={14} /> Officiel</p>
          </div>
          {actifs[0]?.date_fin && (
            <div className="w-full md:w-auto bg-white/5 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl backdrop-blur-md">
              <p className="text-blue-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1">Clôture dans</p>
              <CountdownBadge endDate={actifs[0].date_fin} />
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 md:px-8 mt-6 md:mt-10">
        <div className="flex flex-col lg:flex-row gap-6">

          <div className="flex-1 space-y-8">
            <div className="bg-[#eef2ff] border border-blue-100 text-[#0052ff] p-3 rounded-xl flex items-center gap-2.5">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="text-[11px] md:text-[13px] font-bold">Résultats révélés à la fin du concours.</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-[#0052ff] rounded-full" />
                <h2 className="text-lg md:text-2xl font-black text-slate-900">Catégories <span className="text-slate-400 text-xs font-medium ml-1">({actifs.length})</span></h2>
              </div>
              {actifs.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-100 font-bold text-slate-500 text-xs shadow-sm">Aucun concours actuellement actif</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-5">
                  {actifs.map((vote) => <VoteCard key={vote.id} vote={vote} />)}
                </div>
              )}
            </div>

            {passes.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-slate-300 rounded-full" />
                  <h2 className="text-lg md:text-2xl font-black text-slate-900">Terminés</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-5">
                  {passes.map((vote) => <VoteCard key={vote.id} vote={vote} past={true} />)}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[300px] space-y-4">
            <div className="bg-gradient-to-b from-[#0052ff] to-[#0038b8] rounded-2xl p-4 md:p-5 text-white shadow-lg relative overflow-hidden">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Share2 size={14} className="text-[#ffc107]" /> Partager</h3>
              <div className="space-y-2">
                <button onClick={handleWhatsAppShare} className="w-full bg-[#25D366] text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1fb355] transition-colors"><MessageCircle size={16} /> WhatsApp</button>
                <button onClick={handleCopy} className="w-full bg-white/10 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">{copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? 'Copié' : 'Copier le lien'}</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
              <h3 className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-widest flex items-center justify-between">
                Statistiques globales
                <Activity size={14} className="text-green-500 animate-pulse" />
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-50">
                  <span className="text-slate-400 font-medium">Total Candidats</span>
                  <span className="text-slate-900 font-black text-lg bg-slate-50 px-2 py-1 rounded-md">
                    <AnimatedCounter end={globalStats.candidats} />
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Votes Enregistrés</span>
                  <span className="text-blue-600 font-black text-xl bg-blue-50 px-2 py-1 rounded-md transition-all duration-300">
                    <AnimatedCounter end={globalStats.votes} />
                  </span>
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t border-green-100 flex items-center gap-2 text-green-600 transition-all duration-500 ${recentActivity ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                 <span className="text-[10px] font-bold">Un vote vient d'être validé !</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}