import { useSelector } from 'react-redux';
import { Star, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SocialProof() {
  const { dark } = useSelector(s => s.theme);

  const theme = {
    card: dark ? 'bg-[#0b0b14]/60 border-white/10' : 'bg-white/60 border-slate-200/60',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  };

  const testimonials = [
    { name: "Kevin KOUHAME", role: "Organisateur", img: "/images/kevin.jpg", text: "Gestion fluide, tableau de bord temps réel. Service premium." },
    { name: "Aya Konan", role: "Participante", img: "/images/coach.jpg", text: "Achat en 2 clics, QR instantané. Simple et rapide." },
    { name: "Sergueï KOKOLIKO", role: "Promoteur", img: "/images/brad.jpg", text: "Votes sécurisés, paiements ponctuels. Parfait." },
  ];

  // On triple le tableau pour permettre un défilement infini sans coupure
  const displayItems = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight ${theme.text}`}>
            Rejoignez l'élite des <span className="text-violet-500">événements</span>
          </h2>
          <p className={`max-w-md mx-auto text-sm md:text-base ${theme.sub}`}>Plus de 50 000 utilisateurs font confiance à TickoFiesta.</p>
        </div>

        {/* Carrousel Automatique avec Framer Motion */}
        <div className="flex overflow-hidden mb-12 md:mb-20">
          <motion.div 
            className="flex gap-4 md:gap-8"
            animate={{ x: ["0%", "-33.33%"] }} 
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
            whileHover={{ animationPlayState: "paused" }} // Pause au survol
          >
            {displayItems.map((t, i) => (
              <div key={i} className={`shrink-0 w-[85vw] md:w-[350px] p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border backdrop-blur-md ${theme.card}`}>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400"/>)}
                </div>
                <p className={`text-base md:text-xl mb-8 italic leading-relaxed ${theme.text}`}>"{t.text}"</p>
                
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <img 
                    src={t.img} 
                    alt={t.name} 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-violet-500/30 shadow-lg"
                    onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=' + t.name} 
                  />
                  <div>
                    <div className={`font-black text-base md:text-lg ${theme.text}`}>{t.name}</div>
                    <div className={`text-xs md:text-sm font-medium ${theme.sub}`}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[
            { v: "500+", l: "Events", i: Sparkles },
            { v: "50K+", l: "Tickets", i: TrendingUp },
            { v: "100%", l: "SSL", i: Shield },
            { v: "24/7", l: "Support", i: Zap }
          ].map((s, i) => (
            <div key={i} className={`p-4 md:p-8 rounded-2xl md:rounded-3xl border ${theme.card} flex flex-col items-center text-center`}>
              <s.i className="mb-2 md:mb-4 text-violet-500" size={20} />
              <div className={`text-xl md:text-3xl font-black mb-1 ${theme.text}`}>{s.v}</div>
              <div className={`text-[9px] md:text-[11px] uppercase tracking-widest font-bold ${theme.sub}`}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}