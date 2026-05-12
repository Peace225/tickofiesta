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
  Facebook, Twitter // 👈 Nouvelles icônes ajoutées ici
} from 'lucide-react';

// --- FONCTION UTILITAIRE : RÉCUPÉRATION D'IMAGE ---
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('vote-images').getPublicUrl(path);
  return data.publicUrl;
};

// --- COMPOSANT : COMPTE À REBOURS ---
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

  if (timeLeft.ended) return <div className="text-xl md:text-3xl font-black text-white tracking-widest">TERMINÉ</div>;

  return (
    <div className="flex items-center gap-1.5 text-xl md:text-3xl font-black text-white tracking-widest drop-shadow-lg">
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

// --- COMPOSANT : CARTE DU CONCOURS ---
function VoteCard({ vote, past = false }) {
  const coverImage = getImageUrl(vote.image_url || vote.image);

  return (
    <Link 
      to={`/votes/${vote.id}`}
      className={`group relative flex flex-col justify-between rounded-3xl p-5 overflow-hidden border border-[#2a304d] hover:border-blue-500 transition-all hover:shadow-[0_15px_40px_-10px_rgba(29,78,216,0.3)] min-h-[190px] ${past ? 'opacity-75 grayscale hover:grayscale-0' : ''}`}
    >
      {/* 📸 IMAGE DE COUVERTURE EN ARRIÈRE-PLAN */}
      <div className="absolute inset-0 z-0 bg-[#0f1225]">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={vote.titre} 
            className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1e36] to-[#0f1225]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1225] via-[#0f1225]/70 to-transparent" />
      </div>

      <div className="mb-4 relative z-10">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${past ? 'bg-white/10 text-white/50' : 'bg-[#10b981] text-white shadow-lg shadow-green-500/20'}`}>
          {!past && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          {past ? 'Terminé' : 'Ouvert'}
        </span>
      </div>

      <div className="relative z-10 mt-2">
        <p className="text-white/80 text-[9px] font-black uppercase tracking-[0.2em] mb-1 drop-shadow-md">
          --- {vote.categorie || 'AWARDS'} ---
        </p>
        <h3 className="text-lg md:text-xl font-black text-white leading-tight mb-6 pr-8 line-clamp-2 group-hover:text-blue-400 transition-colors drop-shadow-lg">
          {vote.titre}
        </h3>
      </div>

      {vote.candidats?.length > 0 && (
        <div className="absolute right-4 top-14 flex -space-x-2 z-10">
          {vote.candidats.slice(0, 3).map(c => {
            const avatarUrl = getImageUrl(c.image || c.image_url);
            return (
              <div key={c.id} className="w-8 h-8 rounded-full border-2 border-[#1a1e36] overflow-hidden bg-slate-800 shadow-md transition-transform hover:scale-110 hover:z-20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold bg-gradient-to-br from-[#6c47ff] to-[#00d4aa]">
                    {c.nom?.charAt(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-end justify-between mt-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white/90 text-[11px] font-bold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
            <User size={12} className="text-white/70" /> {vote.candidats?.length || 0}
          </div>
          {!past && (
            <div className="bg-[#facc15] text-black px-3 py-1 rounded text-[10px] font-black shadow-lg shadow-[#facc15]/20 uppercase tracking-widest hover:scale-105 transition-transform">
              Soutenir
            </div>
          )}
        </div>
        
        <span className="text-white/60 text-[10px] font-bold uppercase group-hover:text-white transition-colors flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm border border-white/5">
          Voir <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

// --- PAGE PRINCIPALE ---
export default function VotesPage() {
  const navigate = useNavigate();

  const [actifs, setActifs] = useState([]);
  const [passes, setPasses] = useState([]); 
  const [organizerName, setOrganizerName] = useState('TickoFiesta'); 
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // 👈 NOUVEL ÉTAT POUR LE MENU DE PARTAGE
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Récupération de TOUS les votes
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

      if (data && data.length > 0 && data[0].organisateur_id) {
        const { data: orgData } = await supabase
          .from('profiles')
          .select('nom')
          .eq('id', data[0].organisateur_id)
          .single();
        
        if (orgData && orgData.nom) {
          setOrganizerName(orgData.nom);
        }
      }

    } catch (err) {
      console.error("Erreur votes:", err.message);
      toast.error("Impossible de charger les concours");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotes(true);
    const channel = supabase.channel('realtime:votes_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchVotes(false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchVotes]);

  // FONCTIONS DE PARTAGE
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent("Soutenez vos candidats favoris sur TickoFiesta ! " + window.location.href)}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Soutenez vos candidats favoris sur TickoFiesta !")}`, '_blank');
  };

  const allVotes = [...actifs, ...passes];
  const totalCandidats = allVotes.reduce((acc, v) => acc + (v.candidats?.length || 0), 0);
  const totalVotesCount = allVotes.reduce((acc, v) => acc + (v.total_votes || 0), 0);

  if (loading) return (
    <div className="min-h-screen bg-[#f4f7fe] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <span className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Chargement...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fe] pb-20">
      
      {/* HERO BANNER */}
      <section className="bg-[#0b1129] relative overflow-hidden text-white pt-24 pb-16 px-4 md:px-8 shadow-2xl">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1d4ed8 0%, transparent 50%)' }} />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="flex-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 text-[10px] font-black uppercase tracking-widest transition-colors">
              <ArrowLeft size={16} /> Retour
            </button>
            <div className="inline-flex items-center gap-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Vote ouvert
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-4">
              CONCOURS & AWARDS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#00d4aa]">EN LIGNE</span>
            </h1>
            <p className="text-white/60 flex items-center gap-2 font-medium text-sm">
              <MapPin size={16} /> Plateforme de vote officielle TickoFiesta
            </p>
          </div>

          {actifs[0]?.date_fin && (
            <div className="text-left md:text-right bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Prochaine clôture dans</p>
              <CountdownBadge endDate={actifs[0].date_fin} />
            </div>
          )}
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* COLONNE GAUCHE */}
          <div className="flex-1 space-y-10">
            
            <div className="bg-[#eef2ff] border border-blue-100 text-blue-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-sm font-bold">Les résultats finaux seront révélés à la fin de chaque concours.</span>
            </div>

            {/* SECTION 1 : EN COURS */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h2 className="text-xl md:text-2xl font-black text-slate-900">
                  Choisissez une catégorie <span className="text-slate-400 text-sm font-medium ml-2">({actifs.length} catégories)</span>
                </h2>
              </div>

              {actifs.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-gray-100">
                  <p className="font-bold text-slate-500">Aucun concours en cours</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {actifs.map((vote) => <VoteCard key={vote.id} vote={vote} />)}
                </div>
              )}
            </div>

            {/* SECTION 2 : TERMINÉS */}
            {passes.length > 0 && (
              <div className="pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-slate-300 rounded-full" />
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">
                    Concours Terminés <span className="text-slate-400 text-sm font-medium ml-2">({passes.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {passes.map((vote) => <VoteCard key={vote.id} vote={vote} past={true} />)}
                </div>
              </div>
            )}

          </div>

          {/* COLONNE DROITE : SIDEBAR */}
          <div className="w-full lg:w-[380px] space-y-5">
            
            {/* 1. Bloc : Aide ton candidat à gagner */}
            <div className="bg-gradient-to-b from-[#0047ff] to-[#002b9e] rounded-[1.2rem] p-5 text-white shadow-lg relative overflow-hidden">
              <h3 className="text-[15px] font-bold mb-1 flex items-center gap-2 relative z-10">
                <Share2 size={16} className="text-[#ffc107]" /> Aide ton candidat à gagner
              </h3>
              <p className="text-blue-100 text-[12px] font-medium mb-4 relative z-10">
                Plus le concours circule, plus tu pèses. Partage à tes amis !
              </p>
              
              <div className="space-y-2.5 relative z-10">
                <button onClick={handleWhatsAppShare} className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 rounded-[0.6rem] font-bold text-[13px] transition-colors flex items-center justify-center gap-2">
                  <MessageCircle size={18} /> Partager sur WhatsApp
                </button>
                <div className="flex gap-2.5">
                  <button onClick={handleCopy} className="flex-1 bg-white/10 hover:bg-white/20 py-2.5 rounded-[0.6rem] text-[13px] font-bold transition-colors flex items-center justify-center gap-2">
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? 'Copié' : 'Copier'}
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 py-2.5 rounded-[0.6rem] text-[13px] font-bold transition-colors flex items-center justify-center gap-2">
                    <Mail size={14} /> Email
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 mt-4 relative z-10">
                <p className="text-[#ffc107] text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                  🔥 Dernières 24 heures
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-white/90">Votes enregistrés</span>
                  <span className="text-[15px] font-black tracking-tight">{totalVotesCount > 0 ? totalVotesCount : '224'}</span>
                </div>
              </div>
            </div>
            
            {/* 2. Bloc : Statistiques */}
            <div className="bg-white rounded-[1rem] p-6 shadow-sm border border-gray-100">
              <h3 className="text-[15px] font-bold text-slate-900 mb-5">Statistiques</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100/60">
                  <span className="text-slate-400 text-[13px] font-medium">Participants</span>
                  <span className="text-slate-900 font-bold text-[14px]">{totalCandidats}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100/60">
                  <span className="text-slate-400 text-[13px] font-medium">Catégories</span>
                  <span className="text-slate-900 font-bold text-[14px]">{actifs.length}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100/60">
                  <span className="text-slate-400 text-[13px] font-medium">Démarré</span>
                  <span className="text-slate-600 font-medium text-[13px]">18 avr. 2026</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[13px] font-medium">Fin</span>
                  <span className="text-slate-600 font-medium text-[13px]">30 juin 2026</span>
                </div>
              </div>
            </div>
            
            {/* 3. Bloc : Organisé par */}
            <div className="bg-white rounded-[1rem] p-5 shadow-sm border border-gray-100">
              <p className="text-[#8c93a1] text-[11px] font-medium uppercase tracking-wider mb-4">Organisé par</p>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-[0.6rem] bg-[#0052ff] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
                  {organizerName.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-bold text-[15px] text-slate-900">{organizerName}</h4>
              </div>
            </div>

            {/* 4. Bloc : Bouton Partager le concours (AVEC POPUP SOCIAL) */}
            <div className="relative">
              {/* Menu Popup qui s'affiche quand showShareMenu est true */}
              {showShareMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-3 bg-white border border-gray-100 shadow-xl rounded-2xl p-4 z-50 transition-all duration-300">
                  <p className="text-[11px] font-bold text-center text-slate-500 mb-3 uppercase tracking-widest">Partager sur</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={handleWhatsAppShare} className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:scale-110 hover:bg-[#25D366] hover:text-white transition-all">
                      <MessageCircle size={18} />
                    </button>
                    <button onClick={handleFacebookShare} className="w-10 h-10 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center hover:scale-110 hover:bg-[#1877F2] hover:text-white transition-all">
                      <Facebook size={18} />
                    </button>
                    <button onClick={handleTwitterShare} className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:scale-110 hover:bg-slate-800 hover:text-white transition-all">
                      <Twitter size={18} />
                    </button>
                    <button onClick={handleCopy} className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:scale-110 transition-all">
                      {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)} 
                className={`w-full py-3.5 rounded-[0.85rem] text-[14px] font-bold transition-colors flex items-center justify-center gap-2 relative z-10 ${showShareMenu ? 'bg-[#0052ff] text-white shadow-lg' : 'bg-[#eef4ff] hover:bg-[#e0eaff] text-[#0052ff]'}`}
              >
                <Share2 size={16} /> {showShareMenu ? 'Fermer' : 'Partager le concours'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}