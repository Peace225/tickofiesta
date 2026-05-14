import { Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function HeroSection({ heroRef, heroInView, stats }) {
  const [activeSlide, setActiveSlide] = useState(0);

  // 🛠️ Ajout de contenus textuels premium pour éviter l'effondrement du layout
  const slides = [
    {
      bg: "/images/bannere.jpeg",
      cta: "Explorer",
      link: "/events"
    },
    {
      bg: "/images/baner.jpeg",
      cta: "Voir les votes",
      link: "/votes"
    },
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
      className="relative w-full h-[450px] md:h-[550px] flex items-center justify-center overflow-hidden bg-[#080812]"
    >
      {/* --- BACKGROUNDS CARROUSEL --- */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
            activeSlide === i ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* IMAGE FLOUTÉE EN ARRIÈRE-PLAN */}
          <img
            src={slide.bg}
            alt="Blur Background"
            className={`absolute inset-0 w-full h-full object-cover opacity-40 blur-3xl transition-transform duration-[8000ms] ease-out ${
              activeSlide === i ? "scale-110" : "scale-100"
            }`}
          />

          {/* IMAGE PRINCIPALE INTACTE */}
          <img
            src={slide.bg}
            alt="Background"
            className={`relative w-full h-full object-contain object-center transition-transform duration-[8000ms] ease-out ${
              activeSlide === i ? "scale-105" : "scale-100"
            }`}
          />
          
          {/* Dégradés pour la lisibilité (Assombris légèrement pour le contraste premium) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080812]/80 via-[#080812]/50 to-[#080812]/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080812]/70 via-transparent to-[#080812]/70" />
        </div>
      ))}

      {/* Orbes décoratifs */}
      <div className="absolute top-[-20%] left-[-10%] w-[30vw] h-[30vw] bg-[#6c47ff]/20 rounded-full blur-[80px] animate-pulse z-10 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[25vw] h-[25vw] bg-[#D4AF37]/15 rounded-full blur-[60px] z-10 pointer-events-none mix-blend-screen" />

      {/* --- CONTENU CENTRAL --- */}
      <div className={`relative z-20 w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col transition-all duration-[1200ms] ease-out ${
        heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>

        {/* Espace central */}
        <div className="flex-1 flex flex-col items-center justify-center mt-4">
          
          {/* Badge Premium */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 shadow-2xl">
            <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
            <span className="text-white/90 text-[10px] font-black tracking-[0.25em] uppercase">
              L'excellence de l'événementiel
            </span>
          </div>

          {/* Titres et Sous-titres */}
          <div className="relative w-full min-h-[120px] sm:min-h-[140px] flex justify-center mb-6">
            {slides.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-x-0 transition-all duration-[1000ms] ease-in-out flex flex-col items-center justify-center ${
                  activeSlide === i
                  ? "opacity-100 translate-y-0 blur-none"
                    : "opacity-0 translate-y-4 blur-sm pointer-events-none"
                }`}
              >
                <h1 className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tighter mb-3">
                  <span className="text-white drop-shadow-2xl">
                    {slide.title}
                  </span>
                  {/* 💎 Dégradé "Or Champagne" plus institutionnel */}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFDF73] to-[#AA7C11] drop-shadow-lg uppercase">
                    {slide.highlight}
                  </span>
                </h1>

                <p className="text-white/80 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md text-center px-4">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>

          {/* Bouton d'action principal */}
          <div className="relative h-14 w-full flex justify-center">
            {slides.map((slide, i) => (
               <Link
                 key={i}
                 to={slide.link}
                 className={`absolute transition-all duration-[800ms] ease-in-out inline-flex items-center gap-3 bg-white text-black px-7 py-3 rounded-full text-xs sm:text-sm font-black uppercase tracking-[0.15em] shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 group ${
                   activeSlide === i ? "opacity-100 scale-100 z-10" : "opacity-0 scale-90 z-0 pointer-events-none"
                 }`}
               >
                 {slide.cta}
                 <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center group-hover:translate-x-1 group-hover:bg-[#D4AF37] transition-all duration-300">
                    <ArrowRight size={12} className="text-white" />
                 </div>
               </Link>
            ))}
          </div>
        </div>

        {/* --- STATISTIQUES ET INDICATEURS --- */}
        <div className="w-full flex items-center justify-between border-t border-white/10 pt-4 sm:pt-5 mt-auto">
          
          {/* Stats Desktop */}
          <div className="hidden sm:flex items-center gap-10">
            {stats && stats.map((s, i) => (
              <div key={i} className="text-left">
                <p className={`text-xl sm:text-2xl font-black mb-0 tracking-tighter ${s.color} drop-shadow-lg leading-none`}>
                  {s.val}
                </p>
                <p className="text-white/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Mobile */}
          <div className="flex items-center gap-5 sm:hidden">
            {stats && stats.slice(0, 2).map((s, i) => (
               <div key={i} className="flex flex-col">
                  <p className={`text-base font-black leading-none ${s.color}`}>{s.val}</p>
                  <p className="text-white/50 text-[8px] font-bold uppercase tracking-widest mt-1">{s.label}</p>
               </div>
            ))}
          </div>

          {/* Dots de Navigation */}
          <div className="flex items-center gap-2.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`transition-all duration-500 rounded-full h-1.5 sm:h-2 ${
                  activeSlide === i
                  ? "w-8 sm:w-10 bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.6)]"
                    : "w-2 sm:w-2.5 bg-white/20 hover:bg-white/50"
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