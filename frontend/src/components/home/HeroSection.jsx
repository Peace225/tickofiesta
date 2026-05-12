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
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section
      ref={heroRef}
      className="relative w-full min-h-[320px] md:min-h-[280px] md:aspect-[1920/500] lg:max-h-[400px] flex items-center justify-center overflow-hidden"
    >
      {/* --- BACKGROUNDS CARROUSEL --- */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            activeSlide === i ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.bg}
            alt="Background"
            className={`w-full h-full object-cover object-center transition-transform duration-1000 ease-out ${
              activeSlide === i ? "scale-105" : "scale-100"
            }`}
          />
          {/* OPACITÉ RÉDUITE ICI : Changement de black/80 à black/20 pour une visibilité maximale */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
          {/* Suppression du voile de couleur pour laisser l'image naturelle */}
          <div className="absolute inset-0 bg-black/10" /> 
        </div>
      ))}

      {/* Orbes - Toujours là pour le style mais ne cachent pas l'image */}
      <div className="absolute top-[-10%] left-[-10%] w-24 md:w-80 h-24 md:h-80 bg-[#6c47ff]/20 rounded-full blur-3xl animate-pulse z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-24 md:w-80 h-24 md:h-80 bg-[#00d4aa]/15 rounded-full blur-3xl animate-bounce duration-1000 z-10 pointer-events-none" />

      {/* --- CONTENU DE LA BANNIÈRE --- */}
      <div className={`relative z-20 w-full max-w-6xl mx-auto px-4 md:px-6 text-center py-6 md:py-0 transition-all duration-1000 ease-out ${
        heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-black/30 border border-white/20 backdrop-blur-md px-2.5 py-1 md:px-3 md:py-1 rounded-full mb-3">
          <Sparkles size={8} className="md:w-2.5 md:h-2.5 text-[#f5a623]" />
          <span className="text-white text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase">
            Plateforme Événementielle
          </span>
        </div>

        {/* Texte */}
        <div className="relative min-h-[100px] md:h-24 mb-3 md:mb-2">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-x-0 transition-all duration-700 flex flex-col items-center ${
                activeSlide === i
                ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <h1 className="flex flex-col md:flex-row justify-center items-center gap-0.5 md:gap-1.5 text-lg sm:text-xl md:text-2xl lg:text-3xl font-black leading-tight md:leading-none tracking-tighter mb-1.5 md:mb-1.5">
                {/* Ajout d'un drop-shadow plus fort pour compenser la clarté de l'image */}
                <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{slide.title}</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f5a623] via-[#fbbf24] to-[#f5a623] drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)] uppercase">
                  {slide.highlight}
                </span>
              </h1>

              <p className="text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)] text-[10px] md:text-[11px] font-bold max-w-sm md:max-w-lg mx-auto leading-relaxed px-4 md:px-2 mb-3">
                {slide.subtitle}
              </p>

              <Link
                to={slide.link}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] shadow-2xl shadow-black/50 hover:scale-105 active:scale-95 transition-all duration-300 group"
              >
                {slide.cta}
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>

        {/* Stats et Dots */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 mt-5 md:mt-4">
          <div className="flex items-center justify-center gap-6 md:gap-8">
            {stats && stats.map((s, i) => (
              <div key={i} className="relative text-center">
                <p className={`text-base md:text-xl font-black mb-0 tracking-tight ${s.color} drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]`}>
                  {s.val}
                </p>
                <p className="text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] drop-shadow-md">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden md:block w-px h-5 bg-white/20" />

          <div className="flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`transition-all duration-300 rounded-full ${
                  activeSlide === i
                  ? "w-5 h-1.5 md:w-4 md:h-1 bg-[#00d4aa] shadow-[0_0_15px_rgba(0,212,170,0.6)]"
                    : "w-1.5 h-1.5 md:w-1 md:h-1 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}