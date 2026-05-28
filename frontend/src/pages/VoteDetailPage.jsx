import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import Spinner from "../components/ui/Spinner";
import toast from 'react-hot-toast';
import { MapPin, Zap, X, CreditCard, Trophy, TrendingUp, ArrowLeft } from 'lucide-react';

const PACKS = [
  { id: 'pack5', votes: 5, prix: 500 },
  { id: 'pack10', votes: 10, prix: 1000 },
  { id: 'pack60', votes: 60, prix: 3000 },
  { id: 'pack100', votes: 100, prix: 5000 },
  { id: 'pack200', votes: 200, prix: 10000 }
];

const CreditModal = ({ isOpen, onClose, onNavigateToRecharge, pack, isProcessing, phoneNumber, setPhoneNumber, paymentMethod, setPaymentMethod }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="text-blue-600" size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Recharger des crédits</h2>
          <p className="text-slate-500 text-sm mb-4">Acheter <b>{pack?.votes} votes</b> pour <b>{pack?.prix} F</b>.</p>
          <div className="space-y-3 text-left mb-4">
            <input type="tel" placeholder="Numéro (ex: 0700000000)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none" />
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white outline-none">
              <option value="orange">Orange Money</option>
              <option value="mtn">MTN MoMo</option>
              <option value="wave">Wave</option>
              <option value="moov">Moov Money</option>
            </select>
          </div>
          <button onClick={onNavigateToRecharge} disabled={isProcessing || !phoneNumber} className="w-full bg-[#0052ff] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50">
            {isProcessing ? "Initialisation..." : "Payer maintenant"}
          </button>
        </div>
      </div>
    </div>
  );
};

const getCandidatImageUrl = (candidat) => candidat?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidat?.nom || 'Candidat')}&background=random&color=fff`;

export default function VoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [voteData, setVoteData] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);
  const [solde, setSolde] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState(PACKS[0]);

  const fetchSolde = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('user_credits').select('balance').eq('user_id', user.id).maybeSingle();
    if (data) setSolde(data.balance);
  }, [user]);

  const loadInitialData = useCallback(async () => {
    try {
      const { data: vData } = await supabase.from('votes').select('*').eq('id', id).single();
      setVoteData(vData);
      const { data: cData } = await supabase.from('candidats').select('*').eq('vote_id', id);
      setCandidats(cData || []);
      const { data: logsData } = await supabase.from('vote_logs').select('candidat_id').eq('event_id', id);
      if (logsData) {
        const counts = {};
        logsData.forEach(v => counts[v.candidat_id] = (counts[v.candidat_id] || 0) + 1);
        setResultats(Object.keys(counts).map(cid => ({ id: cid, total_votes: counts[cid] })));
      }
      fetchSolde();
    } catch (err) { console.error("Erreur:", err); } finally { setLoading(false); }
  }, [id, fetchSolde]);

  useEffect(() => {
    loadInitialData();
    const channel = supabase.channel('realtime-votes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_logs', filter: `event_id=eq.${id}` }, (payload) => {
        setResultats(prev => {
          const cid = payload.new.candidat_id;
          const idx = prev.findIndex(r => r.id === cid);
          if (idx !== -1) { const newRes = [...prev]; newRes[idx].total_votes += 1; return newRes; }
          return [...prev, { id: cid, total_votes: 1 }];
        });
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [id, loadInitialData]);

  const handleVote = async (candidat) => {
    if (!user) return navigate('/login');
    if (solde <= 0) { setPaymentModalOpen(true); return; }
    setVoting(candidat.id);
    try {
      const { error: logErr } = await supabase.from('vote_logs').insert([{ event_id: id, candidat_id: candidat.id, user_id: user.id }]);
      if (logErr) throw logErr;
      await supabase.from('user_credits').update({ balance: solde - 1 }).eq('user_id', user.id);
      setSolde(prev => prev - 1);
      toast.success("Vote enregistré!");
    } catch (err) { toast.error("Échec du vote"); } finally { setVoting(null); }
  };

  const sortedCandidats = useMemo(() => [...candidats].sort((a, b) => (resultats.find(r => r.id === b.id)?.total_votes || 0) - (resultats.find(r => r.id === a.id)?.total_votes || 0)), [candidats, resultats]);
  const maxVotes = sortedCandidats[0]?.total_votes || 1;

  if (loading) return <div className="min-h-screen bg-[#f4f7fe] flex justify-center items-center"><Spinner size="xl" /></div>;

  return (
    <div className="min-h-screen bg-[#f4f7fe] pb-20 relative">
      <CreditModal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} pack={selectedPack} />

      <div className="fixed top-4 right-4 z-[99] bg-white px-4 py-2 rounded-full shadow-md border flex items-center gap-2">
        <CreditCard size={14} className="text-[#0052ff]" />
        <span className="text-xs font-black">{solde} crédits</span>
      </div>

      <header className="relative py-16 px-6 bg-[#050812] border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <Link to="/events" className="inline-flex items-center text-xs font-bold text-white/50 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={14} className="mr-2" /> RETOUR
          </Link>
          <div className="inline-flex items-center gap-2 bg-[#00d4aa]/10 text-[#00d4aa] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-[#00d4aa]/20">
            <Zap size={10} /> Vote en direct
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">{voteData?.categorie || "CONCOURS"}</h1>
          <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
            <MapPin size={14} /> {voteData?.titre || "Compétition en cours"}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCandidats.map((c, index) => {
              const count = resultats.find(r => r.id === c.id)?.total_votes || 0;
              const isLeader = index === 0;
              return (
                <div key={c.id} className={`bg-white p-3 rounded-2xl shadow-sm border transition-all duration-500 ${isLeader ? 'border-[#ffc107] ring-2 ring-[#ffc107]/20 scale-[1.02]' : 'border-slate-100'}`}>
                  <div className="relative mb-2">
                    <img src={getCandidatImageUrl(c)} className="w-full aspect-square object-cover rounded-xl" onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=C"} />
                    {isLeader && <div className="absolute top-1 left-1 bg-[#ffc107] text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg uppercase animate-pulse flex items-center gap-0.5 shadow-lg"><Trophy size={8} /> CHAMPION</div>}
                  </div>
                  <h3 className="text-xs font-black text-slate-800 truncate">{c.nom}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mb-2">{count} votes</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mb-3 overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${isLeader ? 'bg-[#ffc107]' : 'bg-blue-500'}`} style={{ width: `${(count / maxVotes) * 100}%` }} />
                  </div>
                  <button onClick={() => handleVote(c)} disabled={voting === c.id} className={`w-full py-2 rounded-xl font-black text-[10px] uppercase transition-all active:scale-95 ${isLeader ? 'bg-[#ffc107] text-white' : 'bg-slate-900 text-white'}`}>
                    {voting === c.id ? <Spinner size="sm" /> : "Voter"}
                  </button>
                </div>
              );
            })}
          </div>

          <aside className="bg-[#0052ff] rounded-3xl p-6 shadow-xl text-white h-fit lg:sticky lg:top-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} /> Packs de crédits</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {PACKS.map(pack => (
                <button key={pack.id} onClick={() => { setSelectedPack(pack); setPaymentModalOpen(true); }} className="w-full flex justify-between bg-white/10 p-4 rounded-2xl text-sm font-bold hover:bg-white/20 transition-all">
                  {pack.votes} votes <span>{pack.prix} F</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}