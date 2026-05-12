import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import api from '../config/api';
import Spinner from "../components/ui/Spinner";
import toast from 'react-hot-toast';
import {
  MapPin, ArrowLeft, Zap, Star, AlertCircle, ChevronRight, X, 
  CheckCircle2, ChevronLeft, QrCode, Info, Phone, Lock
} from 'lucide-react';

const PACKS = [
  { id: 'pack1', votes: 1, prix: 100 },
  { id: 'pack5', votes: 5, prix: 500 },
  { id: 'pack10', votes: 10, prix: 1000 },
  { id: 'pack30', votes: 30, prix: 3000 },
  { id: 'pack50', votes: 50, prix: 5000 },
  { id: 'pack100', votes: 100, prix: 10000 }
];

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('vote-images').getPublicUrl(path);
  return data.publicUrl;
};

function Countdown({ endDate }) {
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
  
  if (timeLeft.ended) return <div className="text-xl md:text-2xl font-black text-white tracking-widest">TERMINÉ</div>;
  
  return (
    <div className="flex items-center gap-1.5 text-xl md:text-2xl font-black text-white tracking-widest drop-shadow-md">
      <span>{timeLeft.d}j</span>
      <span>{timeLeft.h.toString().padStart(2, '0')}h</span>
      <span>{timeLeft.m.toString().padStart(2, '0')}m</span>
      <span>{timeLeft.s.toString().padStart(2, '0')}s</span>
    </div>
  );
}

export default function VoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [voteData, setVoteData] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [resultats, setResultats] = useState([]);
  const [organizerName, setOrganizerName] = useState('TickoFiesta');
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);
  const [solde, setSolde] = useState(0);

  // --- ÉTATS POUR LA MODALE DE PAIEMENT ---
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); 
  const [candidateToVote, setCandidateToVote] = useState(null);
  const [selectedPaymentPack, setSelectedPaymentPack] = useState(PACKS[3]); 
  
  // Étape 1 : Formulaire
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('orange'); 
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Étape 2 : Passerelle
  const [gatewayCode, setGatewayCode] = useState('');
  const [showQrCode, setShowQrCode] = useState(false); 
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Faux ID de transaction
  const [txId] = useState(() => Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 4) + '-...');

  const getAuthHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const { data: vData, error: vErr } = await supabase.from('votes').select('*').eq('id', id).single();
      if (vErr) throw vErr;
      setVoteData(vData);

      if (vData?.organisateur_id) {
        const { data: orgData } = await supabase.from('profiles').select('nom').eq('id', vData.organisateur_id).single();
        if (orgData?.nom) setOrganizerName(orgData.nom);
      }

      const { data: cData } = await supabase.from('candidats').select('*').eq('vote_id', id);
      setCandidats(cData || []);

      try {
        const { data: logsData, error: logsError } = await supabase.from('vote_logs').select('candidat_id').eq('vote_id', id);
        if (!logsError && logsData) {
          const counts = {};
          logsData.forEach(v => counts[v.candidat_id] = (counts[v.candidat_id] || 0) + 1);
          setResultats(Object.keys(counts).map(cid => ({ id: cid, total_votes: counts[cid] })));
        }
      } catch (logErr) {
        console.warn("Scores ignorés.");
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchSolde = useCallback(async () => {
    if (!user) return;
    try {
      const headers = await getAuthHeader();
      const { data } = await api.get(`/votes/packs/solde/${id}`, { headers });
      setSolde(data?.data?.solde ?? data?.solde ?? 0);
    } catch (err) {
      setSolde(0);
    }
  }, [id, user, getAuthHeader]);

  useEffect(() => {
    loadInitialData();
    fetchSolde();

    const channel = supabase
      .channel(`live_votes_${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_logs', filter: `vote_id=eq.${id}` },
        (payload) => {
          const cid = payload.new.candidat_id;
          setResultats(prev => {
            const exists = prev.find(r => r.id === cid);
            if (exists) return prev.map(r => r.id === cid ? { ...r, total_votes: r.total_votes + 1 } : r);
            return [...prev, { id: cid, total_votes: 1 }];
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [id, loadInitialData, fetchSolde]);

  const handleVote = async (candidat) => {
    if (!user) return navigate('/login');
    
    if (solde > 0) {
      setVoting(candidat.id);
      try {
        const headers = await getAuthHeader();
        const res = await api.post('/votes', { vote_id: id, candidat_id: candidat.id }, { headers });
        setSolde(res.data?.data?.credits_restants ?? solde - 1);
        toast.success(`Vote enregistré avec succès !`, { icon: '🎉' });
      } catch (err) {
        toast.error(err.response?.data?.message || "Échec du vote");
      } finally {
        setVoting(null);
      }
      return;
    }

    openPaymentModal(candidat);
  };

  const openPaymentModal = (candidat = null, pack = null) => {
    if (!user) return navigate('/login');
    setCandidateToVote(candidat);
    if (pack) setSelectedPaymentPack(pack);
    setModalStep(1); 
    setShowQrCode(false);
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setTimeout(() => {
      setCandidateToVote(null);
      setPhoneNumber('');
      setFullName('');
      setGatewayCode('');
      setTermsAccepted(false);
      setShowQrCode(false);
      setModalStep(1);
    }, 300); 
  };

  const handleProceedToStep2 = () => {
    if (!termsAccepted) return toast.error("Veuillez accepter les conditions d'utilisation.");
    if (!phoneNumber || phoneNumber.length < 8) return toast.error("Veuillez entrer un numéro valide.");
    if (!paymentMethod) return toast.error("Veuillez choisir un mode de paiement.");
    
    setModalStep(2); 
  };

  const handleFinalPaymentSubmit = async () => {
    setIsProcessingPayment(true);
    const loader = toast.loading("Vérification du paiement en cours...");

    try {
      const headers = await getAuthHeader();
      
      await api.post('/votes/packs/acheter', { 
        pack_id: selectedPaymentPack.id, 
        vote_id: id,
        phone_number: phoneNumber,
        payment_method: paymentMethod,
        auth_code: gatewayCode
      }, { headers });
      
      if (candidateToVote) {
        await api.post('/votes', { vote_id: id, candidat_id: candidateToVote.id }, { headers });
        toast.success(`Paiement réussi ! Vote enregistré.`, { id: loader, icon: '🎉' });
      } else {
        toast.success(`Rechargement réussi !`, { id: loader, icon: '🎉' });
      }

      await fetchSolde(); 
      closePaymentModal();

    } catch (err) {
      toast.error(err.response?.data?.message || "En attente de validation du paiement", { id: loader });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getVotes = (cid) => resultats.find((r) => r.id === cid)?.total_votes || 0;
  const maxVotes = resultats.length > 0 ? Math.max(...resultats.map(r => r.total_votes), 1) : 1;
  const sortedCandidats = useMemo(() => [...candidats].sort((a, b) => getVotes(b.id) - getVotes(a.id)), [candidats, resultats]);

  if (loading) return <div className="min-h-screen bg-[#f4f7fe] flex justify-center items-center"><Spinner size="xl" /></div>;

  const isStep1Valid = termsAccepted && phoneNumber.length >= 8;

  return (
    <div className="min-h-screen bg-[#f4f7fe] pb-20 relative">
      
      {/* HEADER BANNER */}
      <section className="bg-[#0b1129] relative overflow-hidden text-white pt-24 pb-12 px-4 md:px-8 shadow-md">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #1d4ed8 0%, transparent 50%)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-white/50 mb-6 text-[11px] font-bold">
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/')}>Accueil</span>
            <ChevronRight size={12} />
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/votes')}>Concours</span>
            <ChevronRight size={12} />
            <span className="hover:text-white cursor-pointer">{voteData?.titre || 'Édition 2026'}</span>
            <ChevronRight size={12} />
            <span className="text-white">{voteData?.categorie || 'Catégorie'}</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-[#10b981] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 shadow-lg shadow-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Vote ouvert
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] mb-2">
                {voteData?.categorie || "Meilleur Promoteur"}
              </h1>
              <p className="text-white/60 flex items-center gap-1.5 font-medium text-xs">
                <MapPin size={14} /> {voteData?.titre || "GBÔKLÉ AWARDS 2026 1ere édition"}
              </p>
            </div>
            {voteData?.date_fin && (
              <div className="text-left md:text-right">
                <p className="text-[#3b82f6] text-[10px] font-black uppercase tracking-[0.2em] mb-1">SE TERMINE DANS</p>
                <Countdown endDate={voteData.date_fin} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="bg-[#eff4ff] border border-blue-100 text-[#0052ff] p-3.5 rounded-xl flex items-center gap-3 flex-1 shadow-sm">
            <AlertCircle size={18} className="text-[#0052ff] flex-shrink-0" />
            <span className="text-[13px] font-bold">Les résultats seront révélés à la fin du concours</span>
          </div>
          <button onClick={() => navigate('/votes')} className="bg-slate-100 text-slate-700 px-5 py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-sm">
            <ArrowLeft size={16} /> Retour au concours
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-slate-900 rounded-full" />
              <h2 className="text-[18px] font-black text-slate-900">
                Candidats <span className="text-slate-400 font-medium ml-1">({candidats.length})</span>
              </h2>
            </div>
            <p className="text-[13px] font-bold text-slate-900 mb-5">{candidats.length} candidats</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {sortedCandidats.map((c, i) => {
                const vCount = getVotes(c.id);
                const pct = maxVotes === 0 ? 0 : Math.round((vCount / maxVotes) * 100);
                const avatarUrl = getImageUrl(c.image || c.image_url);

                let badgeClass = "bg-[#111827] text-white"; 
                if (i === 0) badgeClass = "bg-[#ffc107] text-black shadow-lg shadow-[#ffc107]/30"; 
                if (i === 1) badgeClass = "bg-[#e2e8f0] text-slate-700 shadow-md"; 
                if (i === 2) badgeClass = "bg-[#cd7f32] text-white shadow-md"; 

                return (
                  <div key={c.id} className="bg-white rounded-[1.25rem] p-3 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100">
                      <div className={`absolute top-2 left-2 px-2.5 py-1 text-[11px] font-black rounded-md z-10 ${badgeClass}`}>
                        ★ N°{i + 1}
                      </div>
                      <img src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nom)}&background=4f46e5&color=fff&size=512`} alt={c.nom} className="w-full h-full object-cover" />
                    </div>

                    <div className="px-1 flex-1 flex flex-col">
                      <h3 className="text-[15px] font-black text-slate-900 mb-4 line-clamp-1">{c.nom}</h3>
                      <div className="mt-auto">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[12px] font-medium text-slate-500">Score</span>
                          <span className="text-[13px] font-black text-[#0052ff]">{vCount.toLocaleString()} pts</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full mb-4 overflow-hidden">
                          <div className="h-full bg-[#0052ff] rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                        </div>

                        <button 
                          onClick={() => handleVote(c)} 
                          disabled={voting === c.id}
                          className="w-full bg-[#ffc107] hover:bg-[#e0a800] text-black font-bold text-[13px] py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          {voting === c.id ? <Spinner size="sm" className="border-black" /> : (
                            <>
                              <Zap size={14} className="fill-black" /> Voter 
                              <span className="font-normal text-[11px] opacity-80">{solde > 0 ? '— 1 crédit' : '— à partir de 100 FCFA'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full lg:w-[320px] space-y-5">
            <div className="bg-[#0052ff] rounded-2xl p-5 shadow-lg shadow-blue-500/20">
              <h3 className="text-[15px] font-bold text-white mb-1 flex items-center gap-2">
                <Star size={16} className="fill-[#ffc107] text-[#ffc107]" /> Acheter des votes
              </h3>
              <p className="text-blue-100 text-[12px] font-medium mb-5">Boostez votre candidat préféré</p>
              <div className="space-y-2">
                {PACKS.map((pack) => (
                  <button 
                    key={pack.id} 
                    onClick={() => openPaymentModal(null, pack)} 
                    className="w-full bg-white/10 hover:bg-white/20 text-white flex justify-between items-center px-4 py-3 rounded-xl text-[13px] font-bold transition-colors border border-transparent"
                  >
                    <span>{pack.votes} vote{pack.votes > 1 ? 's' : ''}</span>
                    <span className="text-[#ffc107]">{pack.prix.toLocaleString()} FCFA</span>
                  </button>
                ))}
              </div>
              
              {user && (
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-white/90">
                  <span className="text-[12px] font-medium">Solde actuel :</span>
                  <span className="text-[14px] font-bold text-[#ffc107]">{solde} votes</span>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-[15px] font-bold text-slate-900 mb-5">Cette catégorie</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <span className="text-slate-400 text-[13px] font-medium">Participants</span>
                  <span className="text-slate-900 font-bold text-[14px]">{candidats.length}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <span className="text-slate-400 text-[13px] font-medium">Statut</span>
                  <span className="text-[#10b981] font-bold text-[13px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></span> Ouvert
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💳 MODALE DE PAIEMENT */}
      {/* ========================================================================= */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#080d20]/80 backdrop-blur-sm">
          
          <div className="bg-white rounded-[1.2rem] w-full max-w-[420px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative animate-in zoom-in-95 duration-200">
            
            {/* HEADER COMMUN */}
            <div className="bg-[#111840] p-4 flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                {candidateToVote ? (
                  <>
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-[#ffc107] bg-white shadow-sm flex-shrink-0">
                      <img src={getImageUrl(candidateToVote.image || candidateToVote.image_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidateToVote.nom)}`} alt="Candidat" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      {modalStep === 1 && <p className="text-blue-200 text-[11px] font-medium leading-tight mb-0.5">Voter pour</p>}
                      <h3 className="text-white text-[15px] font-bold leading-tight">{candidateToVote.nom}</h3>
                      <p className="text-[#ffc107] text-[12px] font-medium mt-0.5">{selectedPaymentPack.votes} votes — {selectedPaymentPack.prix} FCFA</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="text-white text-[15px] font-bold leading-tight">Recharge de compte</h3>
                    <p className="text-[#ffc107] text-[12px] font-medium mt-0.5">Acheter des crédits</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-blue-300 text-[11px] hover:underline cursor-pointer hidden sm:block font-medium">Nouvel onglet</span>
                <button onClick={closePaymentModal} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* --- ÉTAPE 1 : CHOIX DU PACK ET INFOS --- */}
            {/* ========================================================= */}
            {modalStep === 1 && (
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                
                <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-4">Pack de votes</h4>
                
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {PACKS.slice(0,6).map((pack) => {
                    const isSelected = selectedPaymentPack.id === pack.id;
                    return (
                      <div 
                        key={pack.id}
                        onClick={() => setSelectedPaymentPack(pack)}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-[1rem] cursor-pointer border transition-all ${
                          isSelected 
                            ? 'bg-[#0066ff] border-[#0066ff] text-white shadow-md' 
                            : 'bg-[#f8fafc] border-slate-100 hover:border-slate-300 text-slate-900'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-white">
                            <CheckCircle2 size={16} className="fill-white/30 text-white" />
                          </div>
                        )}
                        <span className="text-[20px] font-black leading-none mt-1">{pack.votes}</span>
                        <span className={`text-[11px] mb-2 mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>votes</span>
                        <div className={`px-2 py-1 rounded-lg text-[11px] font-bold w-full text-center ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-slate-700'
                        }`}>
                          {pack.prix} FCFA
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-4">Vos informations</h4>
                
                <div className="space-y-4">
                  
                  {/* Mode de paiement */}
                  <div>
                    <label className="text-[13px] font-bold text-slate-800 mb-2 block">Moyen de paiement <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {['orange', 'wave', 'mtn'].map((method) => (
                        <div 
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`flex justify-center items-center p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === method ? 'border-[#0066ff] bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                        >
                          <img src={`/images/${method}.png`} alt={method} className="h-6 object-contain" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="text-[13px] font-bold text-slate-800 mb-2 block">
                      Numéro de téléphone <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      placeholder="+225 07 XX XX XX XX" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+ ]/g, ''))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    />
                  </div>

                  {/* Nom Complet */}
                  <div>
                    <label className="text-[13px] font-bold text-slate-800 mb-2 block">
                      Nom complet <span className="text-slate-400 font-normal">(facultatif)</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Votre nom" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group mt-2">
                    <div className="relative flex items-center justify-center mt-1">
                      <input 
                        type="checkbox" 
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                      />
                    </div>
                    <span className="text-[13px] text-slate-500 leading-relaxed">
                      J'accepte les <span className="text-[#0066ff] underline">conditions d'utilisation</span> et certifie que mes informations sont exactes.
                    </span>
                  </label>

                  <button 
                    onClick={handleProceedToStep2}
                    disabled={!isStep1Valid}
                    className={`w-full mt-4 font-bold text-[15px] py-4 rounded-xl flex items-center justify-center gap-2 transition-all border ${
                      isStep1Valid 
                        ? 'bg-[#0066ff] text-white border-[#0066ff] hover:bg-blue-700 shadow-md' 
                        : 'bg-[#f1f5f9] text-[#94a3b8] border-[#f1f5f9] cursor-not-allowed'
                    }`}
                  >
                    {!isStep1Valid && <Phone size={16} />}
                    {isStep1Valid ? 'Continuer le paiement' : 'Entrez votre numéro'}
                  </button>
                  
                  <p className="flex items-center justify-center gap-1.5 text-slate-300 text-[12px] font-medium mt-1">
                    <Lock size={14} /> Paiement 100% sécurisé
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* --- ÉTAPE 2 : PASSERELLE DE PAIEMENT --- */}
            {/* ========================================================================= */}
            {modalStep === 2 && (
              <div className="flex flex-col flex-1 bg-white">
                
                {/* Header Orange Money */}
                <div className="bg-black px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <img src="/images/orange.png" alt="Orange Money" className="h-6 object-contain filter invert brightness-0" style={{ filter: 'brightness(0) invert(1)'}} /> 
                  </div>
                  <div className="w-6 h-6 bg-[#ff7900] rounded-sm flex-shrink-0"></div>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar">
                  
                  <button onClick={() => setModalStep(1)} className="text-[#ff7900] text-[13px] font-bold flex items-center gap-1 mb-5">
                    <ChevronLeft size={16} /> Pour revenir sur le site du marchand
                  </button>

                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[18px] font-black text-black">Votre commande</h2>
                    <span className="text-[12px] text-black break-all">{txId}</span>
                  </div>

                  <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-5">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase mb-1">Montant</p>
                      <p className="text-[14px] font-black">{selectedPaymentPack.prix.toFixed(2)} FCFA</p>
                      <p className="text-[12px] text-black mt-1">+Frais: -</p>
                      <p className="text-[13px] font-black text-black mt-1">Montant total: -</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400 font-bold uppercase mb-1">Beneficiaire</p>
                      <p className="text-[13px] font-bold text-black leading-tight">Payment</p>
                      <p className="text-[13px] font-bold text-black leading-tight">request</p>
                      <p className="text-[11px] text-black mt-1.5">{new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}</p>
                    </div>
                  </div>

                  <h2 className="text-[18px] font-black text-black mb-4">Confirmation de paiement</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-[13px] font-bold text-black mb-1 block">Numero de mobile (10 chiffres)*</label>
                      <input 
                        type="text" 
                        value={phoneNumber} 
                        readOnly
                        className="w-[70%] border border-slate-400 rounded px-2 py-1.5 text-[14px] bg-white font-normal text-black outline-none"
                      />
                    </div>
                    
                    {paymentMethod === 'orange' && (
                      <div>
                        <label className="text-[13px] font-bold text-black mb-1 block">Code de paiement (4 chiffres)*</label>
                        <div className="bg-[#f0f7ff] border border-[#cce4ff] p-2.5 rounded mb-2 flex items-start gap-2">
                          <Info size={16} className="text-[#0066ff] mt-0.5 flex-shrink-0" />
                          <p className="text-[12px] text-black leading-tight">Pour générer un code temporaire, ouvrez l'appli Orange Money Afrique et cliquez sur « Mon Compte », ou composez le #144*82#</p>
                        </div>
                        <input 
                          type="password" 
                          maxLength="4"
                          value={gatewayCode}
                          onChange={(e) => setGatewayCode(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-[70%] border border-slate-400 rounded px-2 py-1.5 text-[16px] tracking-[0.2em] font-black outline-none focus:border-[#ff7900]"
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleFinalPaymentSubmit}
                    disabled={isProcessingPayment || (paymentMethod === 'orange' && gatewayCode.length !== 4)}
                    className={`w-[60%] font-bold text-[15px] py-2.5 mb-6 rounded-sm transition-colors ${
                      (paymentMethod !== 'orange' || gatewayCode.length === 4) ? 'bg-[#ff7900] text-white' : 'bg-[#d4d4d4] text-white'
                    }`}
                  >
                    Confirmer
                  </button>

                  {/* Accordéon QR Code */}
                  <div className="mb-4">
                    <div 
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="flex items-center justify-between cursor-pointer py-3 border-t border-slate-200"
                    >
                      <span className="text-[14px] font-bold text-black flex items-center gap-2">
                        <QrCode size={18} /> 
                        J'ai l'application {paymentMethod === 'orange' ? 'Orange Money' : paymentMethod === 'wave' ? 'Wave' : 'MTN'} avec Flash QR Code
                      </span>
                      <ChevronRight size={18} className={`text-black transition-transform ${showQrCode ? 'rotate-90' : ''}`} />
                    </div>

                    {showQrCode && (
                      <div className="pt-2 pb-4">
                         <div className="flex items-center gap-2 mb-4">
                           <img src={`/images/${paymentMethod}.png`} alt="Logo" className="h-6 object-contain" />
                           {paymentMethod === 'orange' && <span className="font-bold text-[18px] tracking-tight leading-none mt-1">Orange<br/>Money</span>}
                         </div>
                         
                         <p className="text-[14px] font-bold text-black mb-4">
                           Gerer votre argent simplement avec l'application {paymentMethod === 'orange' ? 'Orange Money' : paymentMethod === 'wave' ? 'Wave' : 'MTN'}
                         </p>
                         
                         <p className="text-[#ff7900] text-[14px] font-bold mb-3 flex items-center gap-1">
                           Telecharger <ChevronRight size={16} />
                         </p>
                         
                         <div className="flex gap-3 mb-6">
                           <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-8 object-contain bg-black rounded" />
                           <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-8 object-contain bg-black rounded" />
                         </div>
                         
                         <p className="text-[14px] text-black mb-4">
                           Flashez le QR Code et telechargez votre application {paymentMethod === 'orange' ? 'Orange Money' : paymentMethod === 'wave' ? 'Wave' : 'MTN'} ici:
                         </p>
                         
                         <div className="inline-block">
                           <img 
                             src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TickoFiesta_Payment_${selectedPaymentPack.prix}`} 
                             alt="QR Code" 
                             className="w-40 h-40 object-contain mix-blend-multiply"
                           />
                         </div>
                      </div>
                    )}
                  </div>

                  <button onClick={closePaymentModal} className="bg-black text-white text-[13px] font-bold px-4 py-2 mt-2">
                    Annuler la Transaction
                  </button>

                </div>

                {/* Footer Fixe */}
                <div className="p-4 bg-white border-t border-slate-200 mt-auto rounded-b-[24px]">
                   <button 
                    onClick={handleFinalPaymentSubmit}
                    disabled={isProcessingPayment}
                    className="w-full border border-[#0066ff] text-[#0066ff] bg-[#f5f8ff] font-bold text-[14px] py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-50 transition-colors"
                   >
                     {isProcessingPayment ? <Spinner size="sm" color="blue" /> : "J'ai effectué le paiement"}
                   </button>
                   <p className="text-center text-[11px] text-slate-400 mt-2">Mise à jour automatique après confirmation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}