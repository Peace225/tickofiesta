import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, Sparkles, ShieldCheck } from "lucide-react";

export default function CTASection({ ctaRef, ctaInView }) {
  const navigate = useNavigate();

  return (
    <section ref={ctaRef} className="px-4 py-16 md:py-24 relative overflow-hidden">
      {/* Background Glows subtils */}
      <div className="absolute inset-0 -z-10 bg-[#050508]">
        <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-600/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[400px] bg-teal-500/10 blur-[100px] rounded-full" />
      </div>

      <div className={`max-w-4xl mx-auto transition-all duration-1000 ${ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-r from-violet-500 via-teal-400 to-amber-400 opacity-20 blur" />

          {/* Padding mobile réduit (p-6) vs desktop (p-16) */}
          <div className="relative rounded-[2rem] bg-[#0A0A12]/80 backdrop-blur-3xl border border-white/10 p-6 md:p-16 text-center">
            
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-white/90 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Plateforme Certifiée</span>
            </div>

            {/* Titre responsive : taille de police ajustée */}
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
              PRÊT À LÂCHER <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-200">
                LE PLEIN POTENTIEL ?
              </span>
            </h2>

            <p className="text-white/50 mb-8 md:mb-10 text-base md:text-xl max-w-lg mx-auto leading-relaxed">
              Transformez vos idées en événements mémorables. Simple, sécurisé et conçu pour votre succès.
            </p>

            {/* Actions : Flex-col sur mobile, Flex-row sur desktop */}
            <div className="flex flex-col gap-3 sm:flex-row justify-center">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-white text-black font-black px-6 py-4 rounded-2xl text-xs md:text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <span>COMMENCER GRATUITEMENT</span>
                <ArrowRight size={16} />
              </button>

              <Link
                to="/organisateurs"
                className="w-full sm:w-auto bg-white/5 border border-white/10 text-white font-bold px-6 py-4 rounded-2xl text-xs md:text-sm backdrop-blur hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} className="text-teal-400" />
                Démonstration
              </Link>
            </div>
            
            <p className="mt-8 text-[9px] md:text-[10px] text-white/30 font-bold uppercase tracking-widest">
              Aucune carte de crédit requise • Setup en 2 minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}