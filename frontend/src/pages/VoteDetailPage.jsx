import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import Spinner from "../components/ui/Spinner";
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import TopSupportersModal from '../components/vote/TopSupportersModal';
import LiveFeed from '../components/vote/LiveFeed';
import { Zap, X, Trophy, ArrowLeft, Share2, MapPin, Star, CheckCircle2, Lock } from 'lucide-react';

const PACKS = [
  { id: 'pack10', votes: 10, prix: 700 },
  { id: 'pack30', votes: 30, prix: 3000 },
  { id: 'pack50', votes: 50, prix: 5000 },
  { id: 'pack100', votes: 100, prix: 10000 },
  { id: 'pack200', votes: 200, prix: 20000 },
  { id: 'pack250', votes: 250, prix: 25000 }
];

const VoteModal = ({ 
  isOpen, onClose, onPay, packs, selectedPack, setSelectedPack, 
  phoneNumber, setPhoneNumber, fullName, setFullName, paymentMethod, setPaymentMethod, 
  isProcessing, candidat, user 
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!isOpen) return null;

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || fullName || 'Cher supporter';
  const isGlobalRecharge = !candidat;
  const isFormValid = phoneNumber.length >= 8 && acceptedTerms && (user || fullName.trim().length >= 2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* En-tête du Modal */}
        <div className="bg-[#0b1021] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {!isGlobalRecharge ? (
              <img src={candidat.photo_url || '/placeholder.jpg'} alt={candidat.nom} className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-blue-600 flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
            )}
            <div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">
                {isGlobalRecharge ? "Recharge de compte" : `Salut ${userName}, vous votez pour`}
              </p>
              <h3 className="font-black text-sm md:text-base leading-tight mt-0.5">
                {isGlobalRecharge ? "Crédits globaux" : candidat.nom}
              </h3>
              <p className="text-[10px] font-bold text-yellow-500 mt-1">
                {selectedPack.votes} VOTE{selectedPack.votes > 1 ? 'S' : ''} • {selectedPack.prix} FCFA
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar">
          {/* Grille des Packs */}
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pack de votes</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {packs.map((pack) => {
              const isSelected = selectedPack.id === pack.id;
              return (
                <button 
                  key={pack.id} 
                  onClick={() => setSelectedPack(pack)} 
                  className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center ${isSelected ? 'border-blue-600 bg-blue-600 text-white shadow-md scale-[1.02]' : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300'}`}
                >
                  {isSelected && <CheckCircle2 size={14} className="absolute top-1.5 right-1.5 text-white" />}
                  <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-800'}`}>{pack.votes}</span>
                  <span className={`text-[10px] font-medium mb-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>vote{pack.votes > 1 ? 's' : ''}</span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {pack.prix} FCFA
                  </span>
                </button>
              );
            })}
          </div>

          {/* Formulaire Informations */}
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vos informations</h4>
          <div className="space-y-3 mb-5">
            {!user && (
              <div className="relative">
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Nom complet <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="Ex: Jean Dupont" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none transition-all" 
                />
              </div>
            )}

            <div className="relative">
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Numéro de téléphone <span className="text-red-500">*</span></label>
              <input 
                type="tel" 
                maxLength="10" 
                placeholder="Ex: 0700000000" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none transition-all" 
              />
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Moyen de paiement</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 outline-none">
                <option value="orange">Orange Money</option>
                <option value="mtn">MTN MoMo</option>
                <option value="wave">Wave</option>
              </select>
            </div>
          </div>

          {/* Conditions */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input type="checkbox" className="peer sr-only" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              <div className="w-4 h-4 rounded border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors flex items-center justify-center">
                <CheckCircle2 size={12} className="text-white opacity-0 peer-checked:opacity-100" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 leading-tight group-hover:text-slate-700 transition-colors">
              J'accepte les <Link to="/terms" className="text-blue-600 underline">conditions d'utilisation</Link>.
            </span>
          </label>

          <button 
            onClick={onPay} 
            disabled={isProcessing || !isFormValid} 
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-sm py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isProcessing ? <Spinner size="sm" color="white" /> : <Lock size={16} />}
            {isProcessing ? "Initialisation..." : `Payer ${selectedPack.prix} FCFA`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function VoteDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  
  const [voteData, setVoteData] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [solde, setSolde] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCandidatForVote, setSelectedCandidatForVote] = useState(null);
  
  const [supportersModalOpen, setSupportersModalOpen] = useState(false);
  const [selectedCandidatForSupporters, setSelectedCandidatForSupporters] = useState(null);
  
  const [selectedPack, setSelectedPack] = useState(PACKS[2]); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState(''); 
  const [paymentMethod, setPaymentMethod] = useState('orange');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const triggerSuccessAnimation = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#f5a623', '#6c47ff', '#00d4aa'];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    } ( ) ) ;
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const { data: vData, error: vError } = await supabase.from('votes').select('*').eq('slug', slug).single();
      if (vError) throw vError;
      setVoteData(vData);
      
      const { data: cData } = await supabase.from('candidats').select('*').eq('vote_id', vData.id).order('numero', { ascending: true });
      setCandidats(cData || []);
      
      if(user) {
         const { data } = await supabase.from('user_credits').select('balance').eq('user_id', user.id).maybeSingle();
         setSolde(data?.balance || 0);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [slug, user]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!user && !voteData) return;
    let creditChannel;
    let candidatsChannel;

    if (user) {
      creditChannel = supabase.channel(`public:user_credits:user_id=eq.${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_credits', filter: `user_id=eq.${user.id}` }, (payload) => {
          const newBalance = payload.new.balance;
          const oldBalance = payload.old ? payload.old.balance : 0;
          setSolde(newBalance);

          if (newBalance > oldBalance) {
            const addedCredits = newBalance - oldBalance;
            toast.success(`Portefeuille rechargé de ${addedCredits} crédit(s) ! 🔋`, { position: 'top-right' });
            triggerSuccessAnimation();
          }
        })
        .subscribe();
    }

    if (voteData) {
      candidatsChannel = supabase.channel(`public:candidats:vote_id=eq.${voteData.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'candidats', filter: `vote_id=eq.${voteData.id}` }, (payload) => {
          setCandidats(prev => prev.map(c => c.id === payload.new.id ? { ...c, score: payload.new.score } : c));
        })
        .subscribe();
    }

    return () => {
      if (creditChannel) supabase.removeChannel(creditChannel);
      if (candidatsChannel) supabase.removeChannel(candidatsChannel);
    };
  }, [user, voteData, triggerSuccessAnimation]); 

  // PARCOURS B : UTILISATION INSTANTANÉE D'UN CRÉDIT EXISTANT
  const handleInstantVoteWithCredit = async (candidat) => {
    const creditsRestants = solde - 1;
    setSolde(creditsRestants);
    setCandidats(prev => prev.map(c => c.id === candidat.id ? { ...c, score: (c.score || 0) + 1 } : c));
    triggerSuccessAnimation();

    toast.success("Vote pris en compte ! ✨", { position: 'top-center' });

    const { error } = await supabase.from('vote_logs').insert([{ 
      user_id: user.id, 
      candidat_id: candidat.id,
      is_public: true 
    }]);
    
    if (error) {
      setSolde(solde);
      setCandidats(prev => prev.map(c => c.id === candidat.id ? { ...c, score: Math.max(0, (c.score || 0) - 1) } : c));
      toast.error("Une erreur est survenue.");
    }
  };

  // PARCOURS A : DISPATCH API DU PAIEMENT DIRECT / GLOBAL
  const handlePayment = async () => {
    setIsProcessing(true);
    const voterName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || fullName;
    const descriptionText = selectedCandidatForVote 
      ? `Achat direct de ${selectedPack.votes} votes pour ${selectedCandidatForVote.nom}` 
      : `Recharge globale de ${selectedPack.votes} crédits`;

   try {
      const { data, error } = await supabase.functions.invoke('init-geniuspay', {
        body: {
          amount: selectedPack.prix,
          phone_number: phoneNumber, 
          description: descriptionText, 
          userId: user?.id || null,
          
          // 👇 NOUVELLES LIGNES POUR REDIRECTION ET SÉCURITÉ WEBHOOK
          return_url: window.location.href, 
          webhook_url: "https://kmtnulchjoljeyplfoin.supabase.co/functions/v1/geniuspay-webhook",
          // 👆 ====================================================

          metadata: {
            pack_id: selectedPack.id,
            votes_to_credit: selectedPack.votes,
            candidat_id: selectedCandidatForVote?.id || null, 
            candidat_nom: selectedCandidatForVote?.nom || null,
            voter_name: voterName,
            is_guest: !user
          }
        }
      });

      if (error) throw new Error("Erreur de communication avec le serveur.");
      if (data.success === false || data.error) throw new Error(data.error || "Paiement refusé.");

      if (data.payment_url) window.location.href = data.payment_url;
      else throw new Error("URL de redirection introuvable.");

    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareCandidate = async (candidat) => {
    const referralLink = user ? `${window.location.origin}/votes/${slug}?ref=${user.id}` : window.location.href;
    const shareText = `Soutenez ${candidat.nom} !`;
    if (navigator.share) await navigator.share({ title: 'Votez !', text: shareText, url: referralLink });
    else { navigator.clipboard.writeText(referralLink); toast.success("Lien copié !"); }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="xl" /></div>;

  const displayDescription = voteData?.description && voteData.description.length > 150 && !isDescExpanded 
    ? voteData.description.substring(0, 150) + '...' 
    : voteData?.description;

  return (
    <div className="min-h-screen bg-[#f4f7fe] pb-20">
      <VoteModal 
          isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} 
          packs={PACKS} selectedPack={selectedPack} setSelectedPack={setSelectedPack} 
          phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} 
          fullName={fullName} setFullName={setFullName}
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} 
          onPay={handlePayment} isProcessing={isProcessing}
          candidat={selectedCandidatForVote} user={user}
      />

      {supportersModalOpen && selectedCandidatForSupporters && (
         <TopSupportersModal isOpen={supportersModalOpen} onClose={() => setSupportersModalOpen(false)} candidatId={selectedCandidatForSupporters.id} />
      )}

      <header className="bg-[#0b1021] text-white pt-10 pb-14 px-4 md:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto w-full">
          <Link to="/votes" className="inline-flex items-center text-[10px] font-bold text-slate-400 hover:text-white mb-8 transition-colors uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-2" /> Retour
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 bg-[#00d4aa]/10 text-[#00d4aa] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-[#00d4aa]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse"></span>
                {voteData?.category || "VOTES OUVERTS"}
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight uppercase text-white leading-tight mb-4">{voteData?.title || "CONCOURS EN COURS"}</h1>
              <div className="flex items-center text-slate-400 text-xs font-medium gap-1.5 mb-4">
                <MapPin size={14} className="text-slate-500" /> <span>Abidjan, Côte d'Ivoire</span>
              </div>

              {voteData?.description && (
                <div className="border-l-2 border-[#00d4aa] pl-4">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{displayDescription}</p>
                  {voteData.description.length > 150 && (
                    <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="text-[#00d4aa] text-xs font-bold mt-2 hover:underline focus:outline-none">
                      {isDescExpanded ? 'Voir moins' : 'Voir tout'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ✅ LE HEADER COMPREND L'AFFICHAGE PREMIUM DU SOLDE DE CRÉDITS */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              {user && (
                <div className="flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/30 text-[#00d4aa] px-5 py-3 rounded-xl font-black text-sm w-full justify-center sm:w-auto shadow-[0_0_15px_rgba(0,212,170,0.15)] transition-all">
                  <Zap size={16} className={solde > 0 ? "animate-pulse text-[#00d4aa]" : "opacity-50"} />
                  <span>{solde} CRÉDIT{solde > 1 ? 'S' : ''} DISPONIBLE{solde > 1 ? 'S' : ''}</span>
                </div>
              )}
              <Link to={`/votes/${slug}/leaderboard`} className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all w-full sm:w-auto">
                <Trophy size={16} className="text-yellow-400" /> Voir le Classement
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {candidats.map((c, index) => (
              <div key={c.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative group flex flex-col justify-between">
                <div>
                  {index === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full z-10 shadow-md"><Trophy size={14} className="text-yellow-900" /></div>}
                  <img src={c.photo_url} className="w-full aspect-square object-cover rounded-xl mb-3 border border-slate-100" />
                  <button onClick={() => handleShareCandidate(c)} className="absolute top-5 left-5 bg-white/90 p-1.5 rounded-lg shadow-sm hover:bg-white"><Share2 size={14} className="text-slate-600" /></button>
                  <h3 className="font-black text-sm text-slate-800 line-clamp-1 mb-2">{c.nom}</h3>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <button onClick={() => { setSelectedCandidatForSupporters(c); setSupportersModalOpen(true); }} className="text-[10px] font-bold text-yellow-600 bg-yellow-50 hover:bg-yellow-100 px-2 py-1 rounded-md">Voir Sponsors</button>
                    <div className="flex items-center gap-1 text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 shadow-sm">
                      <Star size={12} className="fill-blue-500 text-blue-500" /> {c.score || 0}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (user && solde > 0) {
                        handleInstantVoteWithCredit(c);
                      } else {
                        setSelectedCandidatForVote(c);
                        setSelectedPack(PACKS[2]); 
                        setPaymentModalOpen(true);
                      }
                    }} 
                    className="w-full py-2.5 bg-blue-600 text-white font-black text-[11px] rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                  >
                    VOTER
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-6">
            <LiveFeed voteId={voteData?.id} />
            
            {/* BARRE LATERALE : PACKS COMPTE GLOBAL */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2"><Zap size={14} /> Packs de crédits</h3>
              {PACKS.map(pack => (
                <button 
                  key={pack.id} 
                  onClick={() => { 
                    if (!user) {
                      toast.error("Connectez-vous pour charger des crédits globaux.", { icon: '🔒' });
                      navigate('/login');
                      return;
                    }
                    setSelectedCandidatForVote(null); 
                    setSelectedPack(pack); 
                    setPaymentModalOpen(true); 
                  }} 
                  className="w-full flex justify-between items-center bg-white/10 hover:bg-white/20 transition-colors p-3 mb-2 rounded-xl font-black text-xs"
                >
                  <span>{pack.votes} VOTE{pack.votes > 1 ? 'S' : ''}</span> <span>{pack.prix} FCFA</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}