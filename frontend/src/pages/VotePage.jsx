import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient'; 
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Trophy, Users, Zap, AlertCircle, ChevronLeft, Activity, Image as ImageIcon } from 'lucide-react';

export default function VotePage() {
  const { event_id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);
  
  const [event, setEvent] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // =========================================================================
  // 🛠️ LOGIQUE DE RÉCUPÉRATION DES IMAGES (CORRIGÉE)
  // =========================================================================
  const getImageUrl = (path, bucketName) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Si c'est déjà un lien complet
    
    // On utilise le bucket passé en paramètre (events ou vote-images)
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Charger l'événement
        const { data: eventData, error: eventErr } = await supabase
          .from('events')
          .select('*')
          .eq('id', event_id)
          .single();
        
        if (eventErr) throw eventErr;
        setEvent(eventData);

        // 2. Charger les candidats
        const { data: candidatsData } = await supabase
          .from('candidats')
          .select('*')
          .eq('event_id', event_id);
        
        setCandidats(candidatsData || []);

        // 3. Charger les scores
        const { data: votesData } = await supabase
          .from('vote_logs')
          .select('candidat_id')
          .eq('event_id', event_id);

        if (votesData) {
          const counts = {};
          votesData.forEach(v => {
            counts[v.candidat_id] = (counts[v.candidat_id] || 0) + 1;
          });
          const resultatsFormat = Object.keys(counts).map(id => ({ id, total_votes: counts[id] }));
          setResultats(resultatsFormat);
        }

      } catch (err) { 
        console.error(err);
        toast.error('Erreur lors du chargement des données'); 
      } finally { 
        setLoading(false); 
      }
    };

    loadData();

    // Temps réel
    const channel = supabase
      .channel('public:vote_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_logs', filter: `event_id=eq.${event_id}` },
        (payload) => {
          const newVoteCandidatId = payload.new.candidat_id;
          setResultats(prev => {
            const existing = prev.find(r => r.id === newVoteCandidatId);
            if (existing) {
              return prev.map(r => r.id === newVoteCandidatId ? { ...r, total_votes: r.total_votes + 1 } : r);
            }
            return [...prev, { id: newVoteCandidatId, total_votes: 1 }];
          });
        }
      ).subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsLive(true);
      });

    return () => { supabase.removeChannel(channel); };
  }, [event_id]);

  const handleVote = async (candidat_id) => {
    if (!user) { navigate('/login'); return; }
    setVoting(true);
    try {
      const { error } = await supabase.from('vote_logs').insert([{ event_id, candidat_id, user_id: user.id }]);
      if (error) {
        if (error.code === '23505') throw new Error("Vous avez déjà voté !");
        throw error;
      }
      toast.success('Vote enregistré ! 🎉');
    } catch (err) {
      toast.error(err.message);
    } finally { setVoting(false); }
  };

  const getTotalVotes = () => resultats.reduce((acc, r) => acc + (r.total_votes || 0), 0);
  const getPourcentage = (votes) => {
    const total = getTotalVotes();
    return total === 0 ? 0 : ((votes / total) * 100).toFixed(1);
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white border border-slate-200 shadow-xl',
  };

  if (loading) return <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}><Spinner size="lg" /></div>;

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500 pb-20`}>
      
      {/* --- BANNIÈRE DU CONCOURS --- */}
      <div className="relative h-[300px] md:h-[450px] w-full overflow-hidden">
        {event.image_url ? (
          <img 
            src={getImageUrl(event.image_url, 'events')} // 👈 Utilise le bucket 'events'
            alt={event.titre} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <ImageIcon className="text-white/20" size={60} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-[#080812]/40 to-transparent" />
        
        <div className="absolute bottom-10 left-0 right-0 px-6 max-w-6xl mx-auto">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white mb-6 font-bold">
            <ChevronLeft size={20} /> Retour
           </button>
           <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase">{event.titre}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-5 relative z-10">
        
        {/* Statut Temps Réel */}
        <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 shadow-xl">
                {isLive ? (
                    <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" /><span className="text-green-500 text-[10px] font-black tracking-widest uppercase">Live</span></>
                ) : (
                    <><Activity size={12} className="text-[#f5a623]" /><span className="text-[#f5a623] text-[10px] font-black tracking-widest uppercase">Connexion...</span></>
                )}
            </div>
        </div>

        {/* CANDIDATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {candidats.map((candidat) => {
            const votes = resultats.find(r => r.id === candidat.id)?.total_votes || 0;
            const pct = getPourcentage(votes);

            return (
              <div key={candidat.id} className={`rounded-[2.5rem] p-6 text-center transition-all hover:-translate-y-2 ${theme.card}`}>
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] blur-md opacity-20" />
                  <div className="relative w-full h-full rounded-full border-[3px] border-indigo-500/20 overflow-hidden bg-slate-900">
                    {candidat.image ? (
                      <img 
                        src={getImageUrl(candidat.image, 'vote-images')} // 👈 Utilise le bucket 'vote-images'
                        alt={candidat.nom} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                    )}
                  </div>
                </div>

                <h3 className={`text-xl font-black mb-2 ${theme.text}`}>{candidat.nom}</h3>
                
                <div className="mb-6 px-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className={theme.sub}>{votes} votes</span>
                    <span className="text-indigo-500">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] transition-all duration-1000" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => handleVote(candidat.id)}
                  disabled={voting || !event.vote_actif}
                  className="w-full bg-[#6c47ff] text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-[#6c47ff]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    {event.vote_actif ? <><Zap size={14} /> Voter</> : 'Votes Clôturés'}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}