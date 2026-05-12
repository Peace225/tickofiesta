import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";

export default function CTASection({ ctaRef, ctaInView }) {
  return (
    // Réduction du padding vertical sur mobile (py-8 au lieu de py-12)
    <section ref={ctaRef} className="px-4 py-8 md:py-16">
      <div className={`max-w-4xl mx-auto transition-all duration-1000 ease-out ${ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
        {/* CORRECTION : rounded-3xl au lieu de rounded- */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.25)]">

          <div className="absolute inset-0 bg-[#080812]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#6c47ff]/90 via-[#5035cc]/70 to-[#080812]/95" />

          {/* CORRECTION : ajout des valeurs blur-2xl et blur-3xl */}
          <div className="absolute -top-10 -right-10 w-32 md:w-64 h-32 md:h-64 bg-[#6c47ff] rounded-full blur-2xl md:blur-3xl opacity-40 animate-pulse" />
          <div className="absolute -bottom-20 -left-10 w-32 md:w-48 h-32 md:h-48 bg-[#00d4aa] rounded-full blur-2xl md:blur-3xl opacity-20" />

          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          {/* Réduction du padding intérieur sur mobile (py-8 px-4) */}
          <div className="relative z-10 py-8 md:py-14 px-4 sm:px-12 text-center">

            {/* Badge réduit */}
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-2.5 py-1 md:px-3 md:py-1.5 mb-4 md:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] shadow-[0_0_10px_#00d4aa]" />
              {/* CORRECTION : text-[9px] md:text-[10px] */}
              <span className="text-white/90 text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase">Espace Organisateurs</span>
            </div>

            {/* Titre réduit sur mobile (text-lg) */}
            <h2 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-black text-white mb-2 md:mb-4 tracking-tighter leading-[1.2]">
              VOUS ORGANISEZ<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f5a623] to-[#fbbf24] drop-shadow-[0_8px_8px_rgba(245,166,35,0.2)]">
                DES ÉVÉNEMENTS?
              </span>
            </h2>

            {/* Paragraphe réduit sur mobile (text-[11px]) */}
            <p className="text-white/60 mb-5 md:mb-8 text-[11px] sm:text-xs md:text-sm lg:text-base font-medium max-w-xl mx-auto leading-relaxed px-2 md:px-0">
              Propulsez votre billetterie au niveau supérieur. Créez, gérez et vendez vos accès en quelques minutes avec notre interface intuitive et sécurisée.
            </p>

            {/* Boutons réduits en padding et texte sur mobile */}
            <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 justify-center items-center w-full">
              <Link
                to="/register"
                // CORRECTION : padding réduit px-4 py-2.5 sur mobile, et text-[10px]
                className="w-full sm:w-auto group relative bg-white text-[#080812] font-black px-4 py-2.5 md:px-8 md:py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 text-[10px] md:text-xs"
              >
                CRÉER UN COMPTE
                {/* CORRECTION : w-4 h-4 */}
                <ArrowRight size={14} className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/organisateurs"
                // CORRECTION : padding réduit px-4 py-2.5 sur mobile, et text-[10px]
                className="w-full sm:w-auto group border border-white/20 text-white font-bold px-4 py-2.5 md:px-8 md:py-4 rounded-xl hover:bg-white/5 hover:border-white/40 transition-all duration-300 flex items-center justify-center gap-2 text-[10px] md:text-xs backdrop-blur-sm"
              >
                {/* CORRECTION : w-4 h-4 */}
                <TrendingUp size={14} className="w-3 h-3 md:w-4 md:h-4 text-[#00d4aa]" />
                EN SAVOIR PLUS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}