import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";

export default function CTASection({ ctaRef, ctaInView }) {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate('/register', { replace: false });
  };

  return (
    <section ref={ctaRef} className="px-4 py-12 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050508]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w- h- bg-[radial-gradient(circle,_rgba(108,71,255,0.25)_0%,_transparent_60%)] blur-3xl" />
      </div>

      <div className={`max-w-5xl mx-auto transition-all duration-1000 ${ctaInView? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="relative group">
          {/* bordure corrigée */}
          <div className="absolute -inset- rounded- bg-gradient-to-r from-[#6c47ff] via-[#00d4aa] to-[#f5a623] opacity-60 blur-xl group-hover:opacity-80 transition-opacity duration-700" />

          <div className="relative overflow-hidden rounded-[1.8rem] bg-[#0a0a12]/90 backdrop-blur-3xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6c47ff]/30 via-[#5035cc]/20 to-transparent" />
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#6c47ff] rounded-full blur- opacity-30 animate-pulse" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#00d4aa] rounded-full blur- opacity-20 animate-pulse" />
            </div>

            <div className="relative z-10 px-6 sm:px-12 lg:px-16 py-12 md:py-20 text-center">
              <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/15 backdrop-blur-xl rounded-full px-4 py-2 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4aa] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d4aa]"></span>
                </span>
                <Sparkles size={14} className="text-[#f5a623]" />
                <span className="text-white/90 text- font-black tracking-[0.22em] uppercase">
                  Espace Organisateurs Pro
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-[1.1]">
                VOUS ORGANISEZ
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f5a623] via-[#ffd36b] to-[#f5a623]">
                  DES ÉVÉNEMENTS?
                </span>
              </h2>

              <p className="text-white/70 mb-10 text-base md:text-lg max-w-2xl mx-auto">
                Passez au niveau supérieur. Créez, gérez et vendez vos billets en 3 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={handleRegister}
                  className="group/btn relative w-full sm:w-auto overflow-hidden bg-white text-black font-black px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2.5 text-sm cursor-pointer"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-black/10 to-transparent skew-x-12" />
                  <span className="relative z-10">CRÉER UN COMPTE GRATUIT</span>
                  <ArrowRight size={18} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <Link
                  to="/organisateurs"
                  className="group w-full sm:w-auto bg-white/5 border border-white/15 text-white font-semibold px-8 py-4 rounded-2xl backdrop-blur-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2.5 text-sm"
                >
                  <TrendingUp size={18} className="text-[#00d4aa] group-hover:rotate-12 transition-transform" />
                  Voir la démo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}