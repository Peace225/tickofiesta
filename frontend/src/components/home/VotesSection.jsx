import { Link } from "react-router-dom";
import { Trophy, Users, ChevronRight, ChevronLeft, ArrowRight, Zap } from "lucide-react";

export default function VotesSection({ votes = [], dark, votesRef, votesInView, votePage, setVotePage, PAGE_SIZE = 5 }) {
  // Sécurité anti-crash
  if (!votes || votes.length === 0) return null;

  const totalPages = Math.ceil(votes.length / PAGE_SIZE);
  const displayedVotes = votes.slice(votePage * PAGE_SIZE, (votePage + 1) * PAGE_SIZE);
  
  const text = dark ? "text-[#e8e6ff]" : "text-gray-900";
  const cardBg = dark 
    ? "bg-[#0f0e1a]/90 backdrop-blur-md border-[rgba(108,71,255,0.2)]" 
    : "bg-white border-gray-100 shadow-xl shadow-gray-200/40";

  return (
    <section 
      ref={votesRef} 
      // Réduction du padding vertical sur mobile
      className={`py-16 md:py-24 px-4 relative overflow-hidden transition-all duration-1000 ${
        votesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${dark ? "bg-[#0a0818]" : "bg-[#fafafe]"}`}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4 md:gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 md:gap-2 bg-[#f5a623]/10 border border-[#f5a623]/20 rounded-full px-3 md:px-5 py-1.5 md:py-2 mb-4 md:mb-6">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#f5a623] animate-pulse shadow-[0_0_8px_#f5a623]" />
              <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] uppercase text-[#f5a623]">Concours en Direct</span>
            </div>
            
            {/* Titre réduit sur mobile */}
            <h2 className={`text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] ${text}`}>
              VOTEZ POUR VOS <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f5a623] via-[#fbbf24] to-[#f5a623] uppercase">Candidats Favoris</span>
            </h2>
          </div>
          
          {/* Bouton pleine largeur sur mobile (w-full) */}
          <Link to="/votes" className="w-full md:w-auto group flex items-center justify-center gap-2 md:gap-3 text-xs md:text-sm font-black text-[#f5a623] bg-[#f5a623]/5 hover:bg-[#f5a623]/10 px-5 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl border border-[#f5a623]/20 transition-all">
            EXPLORER TOUT <ArrowRight size={16} className="md:w-[18px] md:h-[18px] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {displayedVotes.map((vote, index) => (
            <Link key={vote._id} to={`/votes/${vote._id}`} className={`group relative rounded-[1.5rem] md:rounded-[2.5rem] border overflow-hidden transition-all duration-500 hover:-translate-y-2 md:hover:-translate-y-3 ${cardBg}`}>
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src={vote.event_id?.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-[2s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0818] via-[#0a0818]/40 to-transparent opacity-90" />
                
                {/* Badge Live */}
                <div className="absolute top-4 left-4 md:top-5 md:left-5">
                  <span className="bg-[#f5a623] text-black text-[8px] md:text-[9px] font-black px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl flex items-center gap-1.5 md:gap-2 shadow-xl">
                    <Zap size={10} className="md:w-[12px] md:h-[12px] fill-current" /> VOTE LIVE
                  </span>
                </div>
                
                {/* Contenu bas de carte */}
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
                  <h3 className="text-white font-black text-xs md:text-sm line-clamp-2 mb-3 md:mb-4">{vote.event_id?.titre?.toUpperCase()}</h3>
                  
                  <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/10">
                    <div className="flex flex-col">
                      <span className="text-white/40 text-[7px] md:text-[8px] font-bold uppercase tracking-[0.2em]">Candidats</span>
                      <span className="text-white text-[10px] md:text-xs font-black flex items-center gap-1 md:gap-1.5">
                        <Users size={10} className="md:w-[12px] md:h-[12px] text-[#6c47ff]" /> {vote.candidats?.length || 0}
                      </span>
                    </div>
                    
                    <div className="bg-white text-black p-2 md:p-3 rounded-xl md:rounded-2xl group-hover:bg-[#f5a623] transition-all">
                      <Trophy size={14} className="md:w-[16px] md:h-[16px]" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}