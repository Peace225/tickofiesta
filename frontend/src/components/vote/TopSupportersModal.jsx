import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { X, Crown, Zap, User, ChevronRight, Trophy, Star } from 'lucide-react';
import Spinner from '../ui/Spinner';

export default function TopSupportersModal({ isOpen, onClose, candidat, onSponsorClick }) {
  const [supporters, setSupporters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !candidat) return;

    const fetchTopSupporters = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('vote_logs')
          .select(`
            user_id,
            profiles ( nom, avatar_url )
          `)
          .eq('candidat_id', candidat.id);

        if (error) throw error;

        const voteCounts = {};
        (data || []).forEach(log => {
          if (!voteCounts[log.user_id]) {
            voteCounts[log.user_id] = {
              user_id: log.user_id,
              count: 0,
              nom: log.profiles?.nom || 'Supporter Anonyme',
              avatar: log.profiles?.avatar_url || null
            };
          }
          voteCounts[log.user_id].count += 1;
        });

        const sortedSupporters = Object.values(voteCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setSupporters(sortedSupporters);
      } catch (error) {
        console.error("Erreur lors de la récupération des supporters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSupporters();
  }, [isOpen, candidat]);

  if (!isOpen) return null;

  const votesToBeat = supporters.length > 0 ? supporters[0].count + 1 : 10;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      {/* Modification ici : max-w-sm au lieu de max-w-md */}
      <div className="w-full max-w-sm relative group">
        
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-amber-600 rounded-3xl blur-md opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"></div>

        <div className="bg-gradient-to-b from-[#111625] to-[#0a0d16] rounded-3xl p-1 shadow-2xl relative border border-white/5 overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-32 bg-yellow-500/10 blur-[60px] pointer-events-none" />

          {/* Réduction du padding (p-5 au lieu de p-6) */}
          <div className="bg-gradient-to-b from-[#13192b] to-[#0a0d16] rounded-[22px] p-5 relative z-10 h-full">
            <button onClick={onClose} className="absolute top-3 right-3 text-white/40 hover:text-white hover:bg-white/10 transition-all bg-white/5 p-1.5 rounded-full z-20">
              <X size={14} />
            </button>
            
            {/* Réduction de la marge en bas (mb-5) et taille de l'icône */}
            <div className="text-center mb-5 relative">
              <Trophy size={32} className="mx-auto text-yellow-400 mb-1.5 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 tracking-tight">Le Mur des Champions</h2>
              <p className="text-white/60 text-[11px] font-medium mt-0.5">Mécènes de <span className="text-yellow-400 font-bold">{candidat?.nom}</span></p>
            </div>

            {loading ? (
              <div className="py-8 flex justify-center"><Spinner /></div>
            ) : supporters.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10 mb-5">
                <Crown size={28} className="mx-auto text-yellow-400/50 mb-2" />
                <p className="text-white/80 font-bold text-xs">Aucun sponsor pour le moment.</p>
                <p className="text-yellow-400/70 text-[10px] mt-1 font-medium">Prends la 1ère place !</p>
              </div>
            ) : (
              /* Réduction de l'espace entre les éléments (space-y-2) */
              <div className="space-y-2 mb-5">
                {supporters.map((supporter, index) => {
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;

                  return (
                    <div key={supporter.user_id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isFirst 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/5 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.15)] scale-[1.02]' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        
                        {/* Réduction de la taille des avatars (w-9 h-9) */}
                        <div className="relative flex items-center justify-center w-9 h-9">
                          {isFirst && <Crown size={16} className="absolute -top-2.5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,1)] z-20 rotate-12" />}
                          <div className={`w-9 h-9 rounded-full overflow-hidden border-[1.5px] relative z-10 ${isFirst ? 'border-yellow-400' : isSecond ? 'border-slate-300' : isThird ? 'border-amber-600' : 'border-white/10'}`}>
                            {supporter.avatar ? (
                              <img src={supporter.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#1a2333] flex items-center justify-center"><User size={14} className={isFirst ? "text-yellow-400/50" : "text-white/30"} /></div>
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black z-20 shadow-sm ${isFirst ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-black' : isSecond ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black' : isThird ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' : 'bg-slate-800 text-white border border-white/20'}`}>
                            {index + 1}
                          </div>
                        </div>

                        <div>
                          <p className={`font-black text-xs leading-tight ${isFirst ? 'text-yellow-400 drop-shadow-sm' : 'text-white'}`}>{supporter.nom}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-wider ${isFirst ? 'text-yellow-400/70' : 'text-white/40'}`}>
                            {isFirst ? 'Champion' : 'Top Fan'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-black text-lg leading-none ${isFirst ? 'text-yellow-400 drop-shadow-sm' : 'text-white'}`}>{supporter.count}</span>
                        <span className="text-[8px] text-white/40 block uppercase font-bold tracking-widest mt-0.5">Votes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Réduction du padding du bouton */}
            <button 
              onClick={() => {
                onClose();
                onSponsorClick(candidat);
              }} 
              className="w-full relative group overflow-hidden rounded-xl p-[2px] transform transition-transform active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-300 bg-[length:200%_auto] animate-gradient" />
              
              <div className="relative bg-gradient-to-b from-yellow-500 to-amber-600 rounded-[10px] px-3 py-3 flex items-center justify-between shadow-lg">
                
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-[10px] pointer-events-none" />

                <div className="flex items-center gap-2.5 text-left relative z-10">
                  <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                    <Star size={16} className="text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-black font-black text-sm leading-tight drop-shadow-sm uppercase tracking-wide">
                      {supporters.length > 0 ? "Prendre la Couronne" : "Devenir Sponsor #1"}
                    </p>
                    <p className="text-black/70 text-[9px] font-black uppercase tracking-widest">
                      Acheter {votesToBeat} votes pour dominer
                    </p>
                  </div>
                </div>
                <div className="bg-black/10 p-1 rounded-full relative z-10">
                  <ChevronRight size={16} className="text-black group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}