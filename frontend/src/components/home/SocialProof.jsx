import { useSelector } from 'react-redux';
import { Star, Quote, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function SocialProof() {
  const { dark } = useSelector(s => s.theme);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const o = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);

  const theme = {
    card: dark? 'bg-[#0b0b14]/60 border-white/10' : 'bg-white/60 border-slate-900/5',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-600',
  };

  const testimonials = [
    { name: "Marc-Arthur", role: "Organisateur", img: "https://i.pravatar.cc/80?u=1", text: "Gestion fluide, tableau de bord temps réel. Service premium.", badge: "TOP" },
    { name: "Aya Konan", role: "Participante", img: "https://i.pravatar.cc/80?u=2", text: "Achat en 2 clics, QR instantané. Simple et rapide.", badge: "VIP" },
    { name: "Cissé I.", role: "Promoteur", img: "https://i.pravatar.cc/80?u=3", text: "Votes sécurisés, paiements ponctuels. Parfait.", badge: "PRO" },
  ];

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
    <section ref={ref} className="py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-3">
        {/* HEADER MINI */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 mb-3">
            <Star size={10} className="text-amber-500" fill="currentColor" />
            <span className="text- font-bold tracking-widest uppercase bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">SOCIAL PROOF</span>
          </div>
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-extrabold ${theme.text}`}>
            La référence <span className="text-violet-600">événements</span>
          </h2>
          <p className={`text-xs mt-1.5 ${theme.sub}`}>50k+ utilisateurs</p>
        </div>

        {/* TESTIMONIALS COMPACT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {testimonials.map(t => (
            <div key={t.name} className={`rounded-xl p-3.5 border backdrop-blur-xl ${theme.card}`}>
              <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_,i)=><Star key={i} size={10} className="fill-amber-500 text-amber-500"/>)}</div>
              <p className={`text- leading-snug mb-2.5 ${theme.text}`}>“{t.text}”</p>
              <div className="flex items-center gap-2">
                <img src={t.img} className="w-7 h-7 rounded-md" alt="" />
                <div>
                  <div className={`text- font-semibold leading-none ${theme.text}`}>{t.name}</div>
                  <div className={`text- ${theme.sub}`}>{t.role}</div>
                </div>
                <span className="ml-auto text- font-bold px-1.5 py-0.5 rounded bg-amber-500 text-black">{t.badge}</span>
              </div>
            </div>
          ))}
        </div>

        {/* STATS MINI */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map(s => {
            const I = s.i;
            return (
              <div key={s.l} className={`rounded-xl p-3 text-center border backdrop-blur-xl ${theme.card}`}>
                <div className={`w-7 h-7 mx-auto mb-1.5 rounded-lg bg-gradient-to-br ${s.c} grid place-items-center`}>
                  <I size={12} className="text-white" />
                </div>
                <div className={`text-base font-black leading-none ${theme.text}`}><Counter end={s.v} suffix={s.s} /></div>
                <div className={`text- uppercase font-semibold mt-0.5 ${theme.sub}`}>{s.l}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}