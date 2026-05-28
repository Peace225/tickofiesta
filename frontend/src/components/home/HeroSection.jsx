import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function HeroSection({ heroRef, heroInView, stats }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    { bg: "/images/bannere.jpeg", link: "/events" },
    { bg: "/images/baner.jpeg", link: "/votes" },
    { bg: "/images/banier01.jpeg", link: "/votes" },
    { bg: "/images/banier1.jpeg", link: "/events" },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(p => (p + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section
      ref={heroRef}
      // Hauteur réduite à 260px sur mobile
      className="relative w-full h-[260px] sm:h-[400px] md:h-[450px] bg-[#080812] overflow-hidden"
    >
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            activeSlide === i ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={s.bg}
            className="absolute inset-0 w-full h-full object-contain md:object-cover"
            alt="Bannière événement"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-transparent to-black/20" />
        </div>
      ))}

      <div className="relative z-10 h-full flex flex-col justify-between p-3 md:p-6">
        
        {/* Bouton masqué sur mobile (hidden), visible sur desktop (md:flex) */}
        <div className="flex-1 hidden md:flex items-center justify-center">
          <div className="text-center">
            <Link
              to={slides[activeSlide].link}
              className="inline-flex items-center gap-2 bg-amber-400 text-black px-6 py-2.5 rounded-full text-xs font-black hover:bg-white transition-all shadow-xl active:scale-95"
            >
              EXPLORER <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Barre des statistiques (légèrement remontée sur mobile) */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center bg-white/10 backdrop-blur-md p-2.5 md:p-4 rounded-xl border border-white/10 mb-1">
            <div className="flex gap-4 md:gap-12">
              {stats?.slice(0, 2).map((st, i) => (
                <div key={i}>
                  <div className={`text-lg md:text-3xl font-black leading-none ${st.color || 'text-white'}`}>
                    {st.val}
                  </div>
                  <div className="text-[8px] md:text-[10px] text-white/60 uppercase font-bold tracking-widest mt-0.5">
                    {st.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Indicateur de slide */}
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === activeSlide ? 'w-5 bg-amber-400' : 'w-1 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}