import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from "../../config/supabaseClient";
import { ArrowLeft, Trophy, Crown, Medal, TrendingUp, Zap } from 'lucide-react';

export default function LeaderboardPage() {
  const { slug } = useParams();
  const { dark } = useSelector((s) => s.theme);
  
  const [candidats, setCandidats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Thème dynamique Ultra-Premium
  const theme = {
    bg: dark ? 'bg-[#0A0A12]' : 'bg-[#f4f7fe]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#161621] border-white/5 shadow-none' : 'bg-white border-slate-100 shadow-sm',
    glass: dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
  };

  useEffect(() => {
    let channel;

    const fetchLiveLeaderboard = async () => {
      try {
        // 1. Récupération de l'ID du concours actuel via le slug
        const { data: vData, error: vError } = await supabase
          .from('votes')
          .select('id')
          .eq('slug', slug)
          .single();

        if (vError || !vData) throw new Error("Concours introuvable");

        // 2. Chargement initial trié par la colonne 'score' de tes candidats
        const { data: cData, error: cError } = await supabase
          .from('candidats')
          .select('*')
          .eq('vote_id', vData.id);

        if (cError) throw cError;

        if (cData) {
          setCandidats((cData || []).sort((a, b) => (b.score || 0) - (a.score || 0)));
        }

        // 3. Écoute en temps réel des changements sur le score des candidats (gère les packs de votes multiples)
        channel = supabase
          .channel(`public:candidats:vote_id=eq.${vData.id}`)
          .on(
            'postgres_changes',
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'candidats',
              filter: `vote_id=eq.${vData.id}`
            },
            (payload) => {
              setCandidats((currentList) => {
                const updatedList = currentList.map((c) => 
                  c.id === payload.new.id 
                    ? { ...c, score: payload.new.score } 
                    : c
                );
                // Tri en direct décroissant
                return updatedList.sort((a, b) => (b.score || 0) - (a.score || 0));
              });
            }
          )
          .subscribe();

      } catch (err) {
        console.error("Erreur lors du chargement du classement :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveLeaderboard();

    // 4. Nettoyage à la fermeture de la page
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [slug]);

  // Séparation du Top 3 et des poursuivants
  const top3 = candidats.slice(0, 3);
  const others = candidats.slice(3);

  // Configuration visuelle du podium
  const podiumStyles = {
    1: { height: 'h-48 md:h-64', bg: 'from-yellow-300 via-yellow-500 to-amber-600', ring: 'ring-yellow-400', icon: <Crown size={24} className="text-white" /> },
    2: { height: 'h-40 md:h-52', bg: 'from-slate-300 via-slate-400 to-slate-500', ring: 'ring-slate-300', icon: <Medal size={20} className="text-white" /> },
    3: { height: 'h-32 md:h-44', bg: 'from-amber-600 via-amber-700 to-amber-900', ring: 'ring-amber-600', icon: <Medal size={18} className="text-white" /> },
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.bg}`}>
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg} pb-24`}>
      
      {/* HEADER VISUEL */}
      <header className="relative pt-12 pb-24 px-4 bg-[#0A0A12] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <Link to={`/votes/${slug}`} className="inline-flex items-center text-[10px] font-black text-white/50 hover:text-white transition-colors mb-6 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <ArrowLeft size={14} className="mr-2" /> Retour au vote
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white flex items-center justify-center gap-3">
            <TrendingUp className="text-[#00d4aa]" />
            Classement en Direct
          </h1>
          <p className="text-white/50 mt-3 text-sm font-medium">Les résultats sont synchronisés en temps réel au clic près.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
        
        {/* LE PODIUM DYNAMIQUE */}
        {top3.length > 0 && (
          <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 pt-4">
            
            {/* 2ème Place */}
            {top3[1] && (
              <div className="flex flex-col items-center w-28 md:w-40 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="relative mb-4">
                  <img src={top3[1].photo_url || '/placeholder.jpg'} className={`w-16 h-16 md:w-24 md:h-24 rounded-full object-cover border-4 border-[#0A0A12] ring-4 ${podiumStyles[2].ring}`} alt={top3[1].nom} />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#0A0A12]">#2</div>
                </div>
                <h3 className={`font-black text-xs md:text-sm text-center truncate w-full mb-2 ${theme.text}`}>{top3[1].nom}</h3>
                <div className={`w-full ${podiumStyles[2].bg} bg-gradient-to-t rounded-t-3xl border-x border-t border-white/20 flex flex-col items-center justify-start pt-4 shadow-xl ${podiumStyles[2].height}`}>
                  {podiumStyles[2].icon}
                  <span className="text-white font-black text-xs md:text-base mt-2">{(top3[1].score || 0).toLocaleString()} pts</span>
                </div>
              </div>
            )}

            {/* 1ère Place */}
            {top3[0] && (
              <div className="flex flex-col items-center w-32 md:w-48 animate-in slide-in-from-bottom-12 duration-700 z-10">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 rounded-full animate-pulse"></div>
                  <img src={top3[0].photo_url || '/placeholder.jpg'} className={`w-20 h-20 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#0A0A12] ring-4 relative z-10 ${podiumStyles[1].ring}`} alt={top3[0].nom} />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-[#0A0A12] z-20">#1</div>
                </div>
                <h3 className={`font-black text-sm md:text-lg text-center truncate w-full mb-2 ${theme.text}`}>{top3[0].nom}</h3>
                <div className={`w-full ${podiumStyles[1].bg} bg-gradient-to-t rounded-t-3xl border-x border-t border-white/30 flex flex-col items-center justify-start pt-6 shadow-2xl ${podiumStyles[1].height}`}>
                  {podiumStyles[1].icon}
                  <span className="text-white font-black text-sm md:text-xl mt-2">{(top3[0].score || 0).toLocaleString()} pts</span>
                </div>
              </div>
            )}

            {/* 3ème Place */}
            {top3[2] && (
              <div className="flex flex-col items-center w-28 md:w-40 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="relative mb-4">
                  <img src={top3[2].photo_url || '/placeholder.jpg'} className={`w-16 h-16 md:w-24 md:h-24 rounded-full object-cover border-4 border-[#0A0A12] ring-4 ${podiumStyles[3].ring}`} alt={top3[2].nom} />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#0A0A12]">#3</div>
                </div>
                <h3 className={`font-black text-xs md:text-sm text-center truncate w-full mb-2 ${theme.text}`}>{top3[2].nom}</h3>
                <div className={`w-full ${podiumStyles[3].bg} bg-gradient-to-t rounded-t-3xl border-x border-t border-white/20 flex flex-col items-center justify-start pt-4 shadow-xl ${podiumStyles[3].height}`}>
                  {podiumStyles[3].icon}
                  <span className="text-white font-black text-xs md:text-base mt-2">{(top3[2].score || 0).toLocaleString()} pts</span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* LISTE DES POURSUIVANTS (RANK 4+) */}
        {others.length > 0 && (
          <div className={`rounded-3xl border p-2 md:p-6 ${theme.card} animate-in fade-in duration-1000 delay-300`}>
            <h3 className={`text-xs font-black uppercase tracking-widest mb-6 px-4 ${theme.sub}`}>Le Reste du Classement</h3>
            
            <div className="space-y-3">
              {others.map((candidat, index) => {
                const rank = index + 4;
                // Calcul de la barre basé sur l'objectif fixe global de 1000 votes
                const progressPercentage = Math.min(((candidat.score || 0) / 1000) * 100, 100);

                return (
                  <div key={candidat.id} className={`flex items-center gap-4 p-3 md:p-4 rounded-2xl transition-all hover:scale-[1.005] ${theme.glass}`}>
                    {/* Position */}
                    <div className={`w-8 font-black text-center ${theme.sub}`}>
                      #{rank}
                    </div>

                    {/* Avatar */}
                    <img src={candidat.photo_url || '/placeholder.jpg'} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm" alt={candidat.nom} />

                    {/* Infos & Barre de progression */}
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1.5">
                        <h4 className={`font-black text-sm md:text-base ${theme.text}`}>{candidat.nom}</h4>
                        <span className={`font-bold text-xs md:text-sm ${theme.text}`}>
                          {(candidat.score || 0).toLocaleString()} <span className={`${theme.sub} font-normal text-[11px]`}>/ 1 000 pts</span>
                        </span>
                      </div>
                      
                      {/* La Barre */}
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-[#00d4aa] rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Call to action direct vers le vote */}
                    <Link 
                      to={`/votes/${slug}`}
                      className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      <Zap size={18} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}