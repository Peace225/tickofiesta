import { useSelector } from 'react-redux';
import { Star, Sparkles, TrendingUp, Shield, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function SocialProof() {
  const { dark } = useSelector(s => s.theme);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  const carouselRef = useRef(null); // ✅ Ref pour le carrousel

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);

  const theme = {
    card: dark ? 'bg-[#0b0b14]/60 border-white/10' : 'bg-white/60 border-slate-900/5',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-600',
  };

  const testimonials = [
    { name: "Kevin KOUHAME", role: "Organisateur", img: "/images/kevin.jpg", text: "Gestion fluide, tableau de bord temps réel. Service premium.", badge: "TOP" },
    { name: "Aya Konan", role: "Participante", img: "/images/coach.jpg", text: "Achat en 2 clics, QR instantané. Simple et rapide.", badge: "VIP" },
    { name: "Sergueï KOKOLIKO", role: "Promoteur", img: "/images/brad.jpg", text: "Votes sécurisés, paiements ponctuels. Parfait.", badge: "PRO" },
  ];

  // ✅ On double le tableau pour avoir un bel effet carrousel même sur grand écran
  const carouselData = [...testimonials, ...testimonials];

  // ✅ Fonction pour faire défiler le carrousel via les flèches
  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = window.innerWidth > 640 ? 380 : 300; // Largeur de défilement
      carouselRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const stats = [
    { v: 500, l: "Events", i: Sparkles, c: "from-violet-600 to-violet-400", s: "+" },
    { v: 50, l: "Tickets", i: TrendingUp, c: "from-emerald-500 to-teal-400", s: "K+" },
    { v: 100, l: "SSL", i: Shield, c: "from-amber-500 to-yellow-400", s: "%" },
    { v: 24, l: "Support", i: Zap, c: "from-pink-600 to-rose-400", s: "/7" },
  ];

  const Counter = ({ end, suffix }) => {
    const [n, setN] = useState(0);
    useEffect(() => {
      if (!inView) return;
      let c = 0; const t = setInterval(() => {
        c += end / 60; if (c >= end) { setN(end); clearInterval(t); } else setN(Math.floor(c));
      }, 16); return () => clearInterval(t);
    }, [inView, end]);
    return <>{n}{suffix}</>;
  };

  return (
    <section ref={ref} className="py-10 md:py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-3 relative">
        
        {/* HEADER MINI */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 mb-3">
            <Star size={10} className="text-amber-500" fill="currentColor" />
            <span className="text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">SOCIAL PROOF</span>
          </div>
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-extrabold ${theme.text}`}>
            La référence <span className="text-violet-600">événements</span>
          </h2>
          <p className={`text-xs mt-1.5 ${theme.sub}`}>50k+ utilisateurs font confiance à TickoFiesta</p>
        </div>

        {/* ✅ CARROUSEL TESTIMONIALS */}
        <div className="relative group mb-12">
          
          {/* Flèche Gauche (cachée sur mobile, visible sur desktop au survol) */}
          <button 
            onClick={() => scroll('left')} 
            className={`hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full items-center justify-center shadow-xl border backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 ${dark ? 'bg-black/50 border-white/10 text-white hover:bg-black/80' : 'bg-white/80 border-slate-200 text-slate-800 hover:bg-white'}`}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Conteneur du Carrousel */}
          <div 
            ref={carouselRef} 
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {carouselData.map((t, index) => (
              <div 
                key={index} 
                className={`shrink-0 w-[85vw] sm:w-[350px] snap-center rounded-2xl p-6 border backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 ${theme.card}`}
              >
                <div>
                  <div className="flex gap-1 mb-4">{[...Array(5)].map((_,i)=><Star key={i} size={14} className="fill-amber-500 text-amber-500"/>)}</div>
                  <p className={`text-sm md:text-base font-medium leading-relaxed mb-6 ${theme.text}`}>“{t.text}”</p>
                </div>
                
                <div className="flex items-center gap-4 pt-4 border-t border-white/5 dark:border-white/10">
                  <img src={t.img} className="w-14 h-14 rounded-full object-cover border-2 border-white/10 shadow-md shrink-0" alt={t.name} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold truncate ${theme.text}`}>{t.name}</div>
                    <div className={`text-xs mt-0.5 truncate ${theme.sub}`}>{t.role}</div>
                  </div>
                  <span className="shrink-0 text-[10px] font-black px-2.5 py-1.5 rounded-lg bg-amber-500 text-black tracking-widest">{t.badge}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Flèche Droite */}
          <button 
            onClick={() => scroll('right')} 
            className={`hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full items-center justify-center shadow-xl border backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 ${dark ? 'bg-black/50 border-white/10 text-white hover:bg-black/80' : 'bg-white/80 border-slate-200 text-slate-800 hover:bg-white'}`}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* STATS MINI */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {stats.map(s => {
            const I = s.i;
            return (
              <div key={s.l} className={`rounded-xl p-3 md:p-4 text-center border backdrop-blur-xl transition-all hover:scale-105 ${theme.card}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${s.c} grid place-items-center`}>
                  <I size={16} className="text-white" />
                </div>
                <div className={`text-lg md:text-xl font-black leading-none ${theme.text}`}><Counter end={s.v} suffix={s.s} /></div>
                <div className={`text-[10px] md:text-xs uppercase font-semibold mt-1.5 ${theme.sub}`}>{s.l}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}