import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";

export default function CTASection({ ctaRef, ctaInView }) {
  const navigate = useNavigate();

  return (
    <section ref={ctaRef} className="px-3 py-10 md:py-20 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050508]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w- h- bg-[radial-gradient(circle,_rgba(108,71,255,0.2)_0%,_transparent_60%)] blur-3xl" />
      </div>

      <div className={`max-w-4xl mx-auto transition-all duration-700 ${ctaInView? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-violet-600 via-teal-400 to-amber-500 opacity-50 blur-xl group-hover:opacity-70 transition-opacity" />

          <div className="relative overflow-hidden rounded-3xl bg-[#0a0a12]/90 backdrop-blur-2xl border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-transparent" />

            <div className="relative z-10 px-5 sm:px-10 py-8 sm:py-12 text-center">
              {/* Badge mini */}
              <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative h-1.5 w-1.5 rounded-full bg-teal-400"></span>
                </span>
                <Sparkles size={11} className="text-amber-400" />
                <span className="text-white/80 text- sm:text- font-bold tracking-widest uppercase">
                  Organisateurs Pro
                </span>
              </div>

              {/* TITRE RÉDUIT */}
              <h2 className="text- sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight">
                VOUS ORGANISEZ
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
                  DES ÉVÉNEMENTS?
                </span>
              </h2>

              <p className="text-white/60 mb-6 text-xs sm:text-sm md:text-base max-w-md mx-auto leading-snug">
                Créez et vendez vos billets en 3 minutes. Gratuit.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="group/btn relative w-full sm:w-auto bg-white text-black font-bold px-5 py-3 rounded-xl text-xs sm:text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>CRÉER UN COMPTE</span>
                  <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>

                <Link
                  to="/organisateurs"
                  className="w-full sm:w-auto bg-white/5 border border-white/10 text-white font-medium px-5 py-3 rounded-xl text-xs sm:text-sm backdrop-blur hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <TrendingUp size={14} className="text-teal-400" />
                  Voir démo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}