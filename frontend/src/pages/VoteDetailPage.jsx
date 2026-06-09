import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import Spinner from "../components/ui/Spinner";
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import TopSupportersModal from '../components/vote/TopSupportersModal';
import LiveFeed from '../components/vote/LiveFeed';
import { Zap, X, Trophy, ArrowLeft, Share2, MapPin } from 'lucide-react';

const PACKS = [
  { id: 'pack5', votes: 10, prix: 700 },
  { id: 'pack60', votes: 60, prix: 3000 },
  { id: 'pack100', votes: 100, prix: 5000 },
  { id: 'pack200', votes: 200, prix: 10000 }
];

const CreditModal = ({ isOpen, onClose, onPay, packs, selectedPack, setSelectedPack, phoneNumber, setPhoneNumber, paymentMethod, setPaymentMethod, isProcessing }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        <h2 className="text-xl font-black text-slate-800 mb-4 text-center">Recharger des crédits</h2>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {packs.map((pack) => (
            <button key={pack.id} onClick={() => setSelectedPack(pack)} className={`p-3 rounded-2xl border-2 text-xs font-bold transition-all ${selectedPack.id === pack.id ? 'border-blue-600 bg-blue-50 text-blue-600 scale-[1.02]' : 'border-slate-100 hover:border-slate-200'}`}>
              {pack.votes} votes <br/> <span className="font-black text-sm">{pack.prix} F</span>
            </button>
          ) ) }
        </div>
        <div className="space-y-3 mb-6">
          <input type="tel" maxLength="10" placeholder="Numéro (ex: 0700000000)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white">
            <option value="orange">Orange Money</option>
            <option value="mtn">MTN MoMo</option>
            <option value="wave">Wave</option>
          </select>
        </div>
        <button onClick={onPay} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg">
          {isProcessing ? "Traitement..." : `Payer ${selectedPack.prix} F`}
        </button>
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
  const [supportersModalOpen, setSupportersModalOpen] = useState(false);
  const [selectedCandidatForSupporters, setSelectedCandidatForSupporters] = useState(null);
  
  const [selectedPack, setSelectedPack] = useState(PACKS[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('orange');
  const [isProcessing, setIsProcessing] = useState(false);

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const triggerSuccessAnimation = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#f5a623', '#6c47ff', '#00d4aa'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    } ( ) ) ;
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const { data: vData, error: vError } = await supabase.from('votes').select('*').eq('slug', slug).single();
      if (vError) throw vError;
      setVoteData(vData);
      const { data: cData } = await supabase.from('candidats').select('*').eq('vote_id', vData.id);
      setCandidats(cData || []);
      if(user) {
         const { data } = await supabase.from('user_credits').select('balance').eq('user_id', user.id).maybeSingle();
         setSolde(data?.balance || 0);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [slug, user]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  useEffect(() => {
    if (!user) return; 

    const creditChannel = supabase.channel(`public:user_credits:user_id=eq.${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', 
        schema: 'public',
        table: 'user_credits',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newBalance = payload.new.balance;
        const oldBalance = payload.old ? payload.old.balance : 0;
        setSolde(newBalance);

        if (newBalance > oldBalance) {
          const addedCredits = newBalance - oldBalance;
          toast.success(`Paiement validé ! Vos ${addedCredits} crédits de vote ont été ajoutés.`, {
              position: 'top-right',
              duration: 6000,
          });
          triggerSuccessAnimation();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(creditChannel);
    };
  }, [user, triggerSuccessAnimation]); 

  const handleVote = async (candidat) => {
    if (!user) return navigate('/login');
    
    if (solde <= 0) {
      toast.error("Crédits insuffisants. Veuillez recharger !", { position: 'top-right' });
      setPaymentModalOpen(true);
      return;
    }

    const creditsRestants = solde - 1;
    
    setSolde(creditsRestants);
    triggerSuccessAnimation();

    if (creditsRestants > 0) {
      toast.success(`Vote validé ! Il vous reste ${creditsRestants} crédit(s).`, {
        icon: '✨',
        duration: 3000
      });
    } else {
      toast('Dernier crédit utilisé ! Rechargez pour continuer à soutenir vos candidats.', {
        icon: '🔋',
        style: { background: '#0b1021', color: '#00d4aa' },
        duration: 5000
      });
    }

    const { error } = await supabase.from('vote_logs').insert([{ 
      user_id: user.id, 
      candidat_id: candidat.id,
      is_public: true 
    }]);
    
    if (error) {
      setSolde(solde);
      toast.error("Un problème est survenu lors du vote.");
    }
  };

  const handleShareCandidate = async (candidat) => {
    const referralLink = user 
      ? `${window.location.origin}/votes/${slug}?ref=${user.id}` 
      : window.location.href;
    const shareText = `Soutenez ${candidat.nom} !`;
    if (navigator.share) await navigator.share({ title: 'Votez !', text: shareText, url: referralLink });
    else { navigator.clipboard.writeText(referralLink); toast.success("Lien de parrainage copié !"); }
  };

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error("Veuillez entrer un numéro de téléphone valide.");
      return;
    }

    setIsProcessing(true);

   try {
      const { data, error } = await supabase.functions.invoke('init-geniuspay', {
        body: {
          amount: selectedPack.prix,
          phone_number: phoneNumber, 
          description: `Achat de ${selectedPack.votes} votes`, 
          userId: user?.id,
          metadata: {
            pack_id: selectedPack.id,
            votes_to_credit: selectedPack.votes 
          }
        }
      });

      if (error) {
        throw new Error("Impossible de joindre le serveur de paiement.");
      }

      if (data.success === false || data.error) {
        throw new Error(data.error || "Paiement refusé par le fournisseur.");
      }

      if (data.payment_url) { 
        window.location.href = data.payment_url;
      } else {
        throw new Error("L'URL de paiement est introuvable.");
      }

    } catch (error) {
      console.error("Erreur de paiement:", error);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="xl" /></div>;

  const descriptionText = voteData?.description;
  const isLongDescription = descriptionText && descriptionText.length > 150;
  const displayDescription = isLongDescription && !isDescExpanded 
    ? descriptionText.substring(0, 150) + '...' 
    : descriptionText;

  return (
    <div className="min-h-screen bg-[#f4f7fe] pb-20">

      <CreditModal 
          isOpen={paymentModalOpen} 
          onClose={() => setPaymentModalOpen(false)} 
          packs={PACKS} 
          selectedPack={selectedPack} 
          setSelectedPack={setSelectedPack} 
          phoneNumber={phoneNumber} 
          setPhoneNumber={setPhoneNumber} 
          paymentMethod={paymentMethod} 
          setPaymentMethod={setPaymentMethod} 
          onPay={handlePayment} 
          isProcessing={isProcessing} 
      />

      {supportersModalOpen && selectedCandidatForSupporters && (
         <TopSupportersModal 
            isOpen={supportersModalOpen}
            onClose={() => setSupportersModalOpen(false)}
            candidatId={selectedCandidatForSupporters.id}
         />
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

              {/* ✅ TITRE AJUSTÉ ICI */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight uppercase text-white leading-tight mb-4">
                {voteData?.title || "CONCOURS EN COURS"}
              </h1>

              <div className="flex items-center text-slate-400 text-xs font-medium gap-1.5 mb-4">
                <MapPin size={14} className="text-slate-500" />
                <span>Abidjan, Côte d'Ivoire</span>
              </div>

              {descriptionText && (
                <div className="border-l-2 border-[#00d4aa] pl-4">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap transition-all">
                    {displayDescription}
                  </p>
                  {isLongDescription && (
                    <button 
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="text-[#00d4aa] text-xs font-bold mt-2 hover:underline focus:outline-none transition-colors"
                    >
                      {isDescExpanded ? 'Voir moins' : 'Voir tout'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              {user && (
                <div className="flex items-center gap-2 bg-[#00d4aa]/10 border border-[#00d4aa]/30 text-[#00d4aa] px-5 py-3 rounded-xl font-black text-sm w-full justify-center sm:w-auto shadow-[0_0_15px_rgba(0,212,170,0.15)]">
                  <Zap size={16} className={solde > 0 ? "animate-pulse" : "opacity-50"} />
                  {solde} CRÉDIT{solde > 1 ? 'S' : ''}
                </div>
              )}

              <Link 
                to={`/votes/${slug}/leaderboard`}
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all w-full sm:w-auto"
              >
                <Trophy size={16} className="text-yellow-400" />
                Voir le Classement
              </Link>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            {candidats.map((c, index) => (
              <div key={c.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative group">
                {index === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full z-10"><Trophy size={14} /></div>}
                <img src={c.photo_url} className="w-full aspect-square object-cover rounded-xl mb-3" />
                <button onClick={() => handleShareCandidate(c)} className="absolute top-5 left-5 bg-white/90 p-1.5 rounded-lg shadow-sm"><Share2 size={14} /></button>
                <h3 className="font-black text-sm truncate">{c.nom}</h3>
                <button onClick={() => { setSelectedCandidatForSupporters(c); setSupportersModalOpen(true); }} className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md mt-1 mb-2">Voir Sponsors</button>
                <button onClick={() => handleVote(c)} className="w-full py-2 bg-slate-900 text-white font-black text-[11px] rounded-xl hover:bg-slate-800 transition-colors">VOTER</button>
              </div>
            ))}
          </div>

          <aside className="space-y-6">
            <LiveFeed voteId={voteData?.id} />
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
              <h3 className="font-black text-sm mb-4 flex items-center gap-2"><Zap size={14} /> Packs de crédits</h3>
              {PACKS.map(pack => (
                <button key={pack.id} onClick={() => { setSelectedPack(pack); setPaymentModalOpen(true); }} className="w-full flex justify-between items-center bg-white/10 hover:bg-white/20 transition-colors p-3 mb-2 rounded-xl font-black text-xs">
                  <span>{pack.votes} VOTE{pack.votes > 1 ? 'S' : ''}</span> <span>{pack.prix} F</span>
                </button>
              ))}
            </div>
          </aside>
          
        </div>
      </main>
    </div>
  );
}