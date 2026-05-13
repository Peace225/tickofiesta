import { Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function HeroSection({ heroRef, heroInView, stats }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      bg: "/images/image.jpeg",
      title: "VIVEZ DES MOMENTS",
      highlight: "Inoubliables",
      subtitle: "Concerts, festivals, spectacles. Trouvez votre prochaine sortie.",
      cta: "Explorer",
      link: "/events"
    },
    {
      bg: "/images/slid.jpg",
      title: "VOTEZ POUR VOS",
      highlight: "Favoris",
      subtitle: "Participez aux concours et élisez les meilleurs talents d'Abidjan.",
      cta: "Voir les votes",
      link: "/votes"
    },
    {
      bg: "/images/sld.jpg",
      title: "DEVENEZ UN",
      highlight: "Organisateur",
      subtitle: "Créez et gérez vos événements. On s'occupe de la billetterie.",
      cta: "Commencer",
      link: "/register"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000); 
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section
      ref={heroRef}
      // ⬇️ HAUTEUR RÉDUITE ICI : Format Bannière (300px mobile, 400px PC)
      className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden bg-black"
    >
      {/* --- BACKGROUNDS CARROUSEL --- */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
            activeSlide === i ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={slide.bg}
            alt="Background"
            className={`w-full h-full object-cover object-center transition-transform duration-[8000ms] ease-out ${
              activeSlide === i ? "scale-105" : "scale-100"
            }`}
          />
          
          {/* Dégradés pour la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        </div>
      ))}

      {/* Orbes décoratifs (Subtils) */}
      <div className="absolute top-[-20%] left-[-10%] w-[30vw] h-[30vw] bg-[#6c47ff]/20 rounded-full blur-[80px] animate-pulse z-10 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[25vw] h-[25vw] bg-[#00d4aa]/15 rounded-full blur-[60px] z-10 pointer-events-none mix-blend-screen" />

      {/* --- CONTENU CENTRAL --- */}
      <div className={`relative z-20 w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col transition-all duration-[1200ms] ease-out ${
        heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>

        {/* Espace central pour le texte et le bouton */}
        <div className="flex-1 flex flex-col items-center justify-center mt-2">
          
          {/* Badge Premium */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-4 shadow-xl">
            <Sparkles size={12} className="text-[#f5a623] animate-pulse" />
            <span className="text-white text-[9px] font-black tracking-[0.2em] uppercase">
              L'excellence de l'événementiel
            </span>
          </div>

          {/* Titres et Sous-titres (Hauteur réduite pour s'adapter) */}
          <div className="relative w-full h-[90px] sm:h-[110px] flex justify-center mb-4">
            {slides.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-x-0 transition-all duration-[1000ms] ease-in-out flex flex-col items-center justify-center ${
                  activeSlide === i
                  ? "opacity-100 translate-y-0 blur-none"
                    : "opacity-0 translate-y-4 blur-sm pointer-events-none"
                }`}
              >
                {/* ⬇️ TAILLE DU TEXTE RÉDUITE POUR LE FORMAT BANNIÈRE */}
                <h1 className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tighter mb-2">
                  <span className="text-white drop-shadow-xl">
                    {slide.title}
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] via-[#f5a623] to-[#d97706] drop-shadow-lg uppercase">
                    {slide.highlight}
                  </span>
                </h1>

                <p className="text-white/90 text-xs sm:text-sm font-medium max-w-lg mx-auto leading-relaxed drop-shadow-md">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>

          {/* Bouton d'action principal */}
          <div className="relative h-12 w-full flex justify-center mb-2">
            {slides.map((slide, i) => (
               <Link
                 key={i}
                 to={slide.link}
                 className={`absolute transition-all duration-[800ms] ease-in-out inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 group ${
                   activeSlide === i ? "opacity-100 scale-100 z-10" : "opacity-0 scale-90 z-0 pointer-events-none"
                 }`}
               >
                 {slide.cta}
                 <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight size={10} className="text-white" />
                 </div>
               </Link>
            ))}
          </div>
        </div>

        {/* --- STATISTIQUES ET INDICATEURS (Bottom Bar) --- */}
        <div className="w-full flex items-center justify-between border-t border-white/10 pt-3 sm:pt-4 mt-auto">
          
          {/* Stats */}
          <div className="flex items-center gap-6 sm:gap-10 hidden sm:flex">
            {stats && stats.map((s, i) => (
              <div key={i} className="text-left">
                <p className={`text-lg sm:text-xl font-black mb-0 tracking-tighter ${s.color} drop-shadow-lg leading-none`}>
                  {s.val}
                </p>
                <p className="text-white/60 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Version Mobile des stats (Centrée si écran très petit) */}
          <div className="flex items-center gap-4 sm:hidden">
            {stats && stats.slice(0, 2).map((s, i) => (
               <div key={i} className="flex items-center gap-1.5">
                  <p className={`text-sm font-black ${s.color}`}>{s.val}</p>
                  <p className="text-white/60 text-[7px] font-black uppercase tracking-widest">{s.label}</p>
               </div>
            ))}
          </div>

          {/* Dots de Navigation */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`transition-all duration-500 rounded-full h-1 sm:h-1.5 ${
                  activeSlide === i
                  ? "w-6 sm:w-8 bg-[#f5a623] shadow-[0_0_15px_rgba(245,166,35,0.8)]"
                    : "w-1.5 sm:w-2 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Aller au slide ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}