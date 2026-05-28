import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  MapPin, Users, CheckCircle, Share2, Copy, Mail, User,
  Clock, ArrowLeft, Trophy, Zap, Crown,
  MessageCircle, AlertCircle, ChevronRight, Sparkles,
  Facebook, Twitter 
} from 'lucide-react';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('vote-images').getPublicUrl(path);
  return data.publicUrl;
};

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

function VoteCard({ vote, past = false }) {
  const coverImage = getImageUrl(vote.image_url || vote.image);

  return (
    <Link 
      to={`/votes/${vote.id}`}
      className={`group relative flex flex-col justify-between rounded-xl md:rounded-[20px] p-3 md:p-5 overflow-hidden border border-[#2a304d] hover:border-blue-500 transition-all min-h-[160px] md:min-h-[220px] ${past ? 'opacity-75 grayscale hover:grayscale-0' : ''}`}
    >
      <div className="absolute inset-0 z-0 bg-[#0f1225]">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={vote.titre} 
            className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-700" 
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1e36] to-[#0f1225]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1225] via-[#0f1225]/60 to-transparent" />
      </div>

      <div className="mb-2 md:mb-4 relative z-10">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest ${past ? 'bg-white/10 text-white/50' : 'bg-[#10b981] text-white shadow-lg'}`}>
          {!past && <span className="w-1 h-1 bg-white rounded-full animate-pulse" />}
          {past ? 'Terminé' : 'Ouvert'}
        </span>
      </div>

      <div className="relative z-10 mt-1">
        <p className="text-white/70 text-[7px] md:text-[10px] font-black uppercase tracking-[0.15em] mb-1">
          {vote.categorie || 'AWARDS'}
        </p>
        <h3 className="text-xs md:text-xl font-black text-white leading-tight mb-2 md:mb-6 line-clamp-2 drop-shadow-lg">
          {vote.titre}
        </h3>
      </div>

      <div className="flex items-end justify-between mt-auto relative z-10">
        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="flex items-center gap-1 text-white/90 text-[9px] md:text-[12px] font-bold bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/10">
            <User size={10} className="text-white/70" /> {vote.candidats?.length || 0}
          </div>
          {!past && (
            <div className="hidden xs:block bg-[#facc15] text-black px-2 py-0.5 rounded text-[8px] md:text-[11px] font-black uppercase tracking-wider">
              Voter
            </div>
          )}
        </div>
        
        <span className="text-white/60 text-[8px] md:text-[11px] font-bold uppercase flex items-center gap-0.5">
          Voir <ChevronRight size={10} />
        </span>
      </div>
    </Link>
  );
}

export default function VotesPage() {
  const navigate = useNavigate();
  const [actifs, setActifs] = useState([]);
  const [passes, setPasses] = useState([]); 
  const [organizerName, setOrganizerName] = useState('TickoFiesta'); 
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const fetchVotes = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*, candidats(*)')
        .in('statut', ['actif', 'validé', 'cloture']) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      const activeEvents = [];
      const pastEvents = [];
      const now = new Date();

      (data || []).forEach(vote => {
        if (vote.statut === 'cloture' || (vote.date_fin && new Date(vote.date_fin) < now)) {
          pastEvents.push(vote);
        } else {
          activeEvents.push(vote);
        }
      });

      setActifs(activeEvents);
      setPasses(pastEvents);

      if (data?.[0]?.organisateur_id) {
        const { data: orgData } = await supabase.from('profiles').select('nom').eq('id', data[0].organisateur_id).single();
        if (orgData?.nom) setOrganizerName(orgData.nom);
      }
    } catch (err) {
      console.error("Erreur:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotes(true);
    const channel = supabase.channel('realtime:votes_page').on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchVotes(false)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchVotes]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent("Soutenez vos candidats favoris sur TickoFiesta ! " + window.location.href)}`, '_blank');
  };

  const allVotes = [...actifs, ...passes];
  const totalCandidats = allVotes.reduce((acc, v) => acc + (v.candidats?.length || 0), 0);
  const totalVotesCount = allVotes.reduce((acc, v) => acc + (v.total_votes || 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-[#f4f7fe] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Chargement...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fe] pb-20 font-sans">
      
      {/* HERO BANNER - Plus compact sur mobile */}
      <section className="bg-[#0b1129] relative overflow-hidden text-white pt-20 md:pt-24 pb-12 md:pb-16 px-4 md:px-8 shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1d4ed8 0%, transparent 50%)' }} />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 mb-4 text-[10px] font-black uppercase tracking-widest transition-colors">
              <ArrowLeft size={14} /> Retour
            </button>
            <div className="inline-flex items-center gap-1.5 bg-[#10b981] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> Vote ouvert
            </div>
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-2">
              CONCOURS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00d4aa]">EN LIGNE</span>
            </h1>
            <p className="text-white/60 flex items-center gap-1.5 font-medium text-[12px] md:text-sm">
              <MapPin size={14} /> TickoFiesta Officiel
            </p>
          </div>

          {actifs[0]?.date_fin && (
            <div className="w-full md:w-auto bg-white/5 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl backdrop-blur-md">
              <p className="text-blue-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1">Clôture dans</p>
              <CountdownBadge endDate={actifs[0].date_fin} />
            </div>
          )}
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-3 md:px-8 mt-6 md:mt-10">
        <div className="flex flex-col lg:flex-row gap-6">

          <div className="flex-1 space-y-8">
            <div className="bg-[#eef2ff] border border-blue-100 text-[#0052ff] p-3 rounded-xl flex items-center gap-2.5">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="text-[11px] md:text-[13px] font-bold">Résultats révélés à la fin du concours.</span>
            </div>

            {/* SECTION 1 : EN COURS - 2 COLONNES MOBILE */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-[#0052ff] rounded-full" />
                <h2 className="text-lg md:text-2xl font-black text-slate-900">
                  Catégories <span className="text-slate-400 text-xs font-medium ml-1">({actifs.length})</span>
                </h2>
              </div>

              {actifs.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-100 font-bold text-slate-500 text-xs">
                  Aucun concours
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-5">
                  {actifs.map((vote) => <VoteCard key={vote.id} vote={vote} />)}
                </div>
              )}
            </div>

            {/* SECTION 2 : TERMINÉS - 2 COLONNES MOBILE */}
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

          {/* SIDEBAR */}
          <div className="w-full lg:w-[300px] space-y-4">
            <div className="bg-gradient-to-b from-[#0052ff] to-[#0038b8] rounded-2xl p-4 md:p-5 text-white shadow-lg relative overflow-hidden">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Share2 size={14} className="text-[#ffc107]" /> Partager
              </h3>
              <div className="space-y-2">
                <button onClick={handleWhatsAppShare} className="w-full bg-[#25D366] text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button onClick={handleCopy} className="w-full bg-white/10 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? 'Copié' : 'Copier le lien'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-widest">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Candidats</span>
                  <span className="text-slate-900 font-black">{totalCandidats}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Votes totaux</span>
                  <span className="text-slate-900 font-black">{totalVotesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}