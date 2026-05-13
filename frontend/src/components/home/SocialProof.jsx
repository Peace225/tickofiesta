import { useSelector } from 'react-redux';
import { Star, Quote, Sparkles, TrendingUp, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function SocialProof() {
  const { dark } = useSelector((s) => s.theme);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // THEME CORRIGÉ
  const theme = {
    card: dark
     ? 'bg-[#0b0b14]/70 backdrop-blur-3xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_20px_60px_-20px_rgba(0,0,0,0.8)]'
      : 'bg-white/70 backdrop-blur-3xl border border-slate-900/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8),0_20px_60px_-20px_rgba(108,71,255,0.15)]',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-600',
  };

  const testimonials = [
    {
      id: 1, name: "Marc-Arthur Kouamé", role: "Organisateur de Festivals",
      image: "https://i.pravatar.cc/150?u=marc",
      text: "La plateforme a complètement transformé la gestion de nos événements à Abidjan. La billetterie est fluide, et le tableau de bord nous donne un contrôle total en temps réel. Un service ultra-premium!",
      rating: 5, badge: "Top Organisateur"
    },
    {
      id: 2, name: "Aya Konan", role: "Participante fidèle",
      image: "https://i.pravatar.cc/150?u=aya",
      text: "Je n'ai jamais vu un site aussi simple pour acheter mes tickets de concert et voter pour mes artistes préférés. La réception du QR code est instantanée, c'est la magie!",
      rating: 5, badge: "Membre VIP"
    },
    {
      id: 3, name: "Cissé Ibrahim", role: "Promoteur de Concours",
      image: "https://i.pravatar.cc/150?u=cisse",
      text: "Pour nos compétitions de talents, le module de vote est parfait. Sécurisé, transparent, et le versement des revenus est toujours ponctuel. On ne travaille plus qu'avec eux.",
      rating: 5, badge: "Partenaire Pro"
    }
  ];

  const stats = [
    { val: 500, label: "Événements", icon: Sparkles, color: "from-[#6c47ff] to-[#8b6bff]", suffix: "+" },
    { val: 50, label: "Tickets Vendus", icon: TrendingUp, color: "from-[#00d4aa] to-[#00f5c4]", suffix: "K+" },
    { val: 100, label: "Sécurisé SSL", icon: Shield, color: "from-[#f5a623] to-[#fbbf24]", suffix: "%" },
    { val: 24, label: "Support Local", icon: Zap, color: "from-[#ff3b82] to-[#ff6b9d]", suffix: "/7" },
  ];

  // Compteur animé
  const Counter = ({ end, suffix }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      if (!inView) return;
      let start = 0;
      const duration = 1500;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, [inView, end]);
    return <>{count}{suffix}</>;
  };

  const handleTilt = (e, el) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y - rect.height / 2) / 10) * -1;
    const ry = (x - rect.width / 2) / 10;
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
  };
  const resetTilt = (el) => (el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)');

  return (
    <section ref={sectionRef} className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#6c47ff]/10 via-transparent to-transparent" />
        <div className="absolute top-[-20%] left-[-10%] w- h- bg-[#6c47ff]/20 rounded-full blur- animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w- h- bg-[#00d4aa]/15 rounded-full blur- animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        {/* HEADER */}
        <div className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-1000 ${inView? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-2xl px-5 py-2 rounded-full mb-8">
            <Star size={16} className="text-[#f5a623]" fill="currentColor" />
            <span className="text- font-black tracking-[0.3em] uppercase bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] bg-clip-text text-transparent">
              Social Proof Premium
            </span>
          </div>
          <h2 className={`text-5xl md:text-7xl font-black tracking-tight mb-6 ${theme.text}`}>
            La référence des <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">événements</span>
          </h2>
          <p className={`text-lg md:text-xl ${theme.sub} max-w-2xl mx-auto`}>
            Rejoignez 50 000+ utilisateurs qui nous font confiance pour leurs moments inoubliables.
          </p>
        </div>

        {/* TESTIMONIALS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {testimonials.map((item, i) => (
            <div
              key={item.id}
              onMouseMove={(e) => handleTilt(e, e.currentTarget)}
              onMouseLeave={(e) => resetTilt(e.currentTarget)}
              className={`group relative p- rounded- transition-all duration-700 ${inView? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className={`relative h-full rounded- p-8 md:p-10 ${theme.card} transition-all duration-500 group-hover:-translate-y-1`}>
                <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#f5a623] to-[#fbbf24] text-black text- font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {item.badge}
                </div>
                <Quote size={48} className="absolute top-4 left-4 text-[#6c47ff]/10" />
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-[#f5a623] fill-[#f5a623]" />)}
                </div>
                <p className={`text- leading-relaxed mb-6 italic ${theme.text}`}>“{item.text}”</p>
                <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className={`font-bold text-sm ${theme.text}`}>{item.name}</h4>
                    <p className={`text-xs ${theme.sub}`}>{item.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* STATS CORRIGÉES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="group">
                <div className={`relative rounded-3xl p-8 text-center ${theme.card} hover:-translate-y-1 transition-all`}>
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className={`text-4xl md:text-5xl font-black mb-1 ${theme.text}`}>
                    <Counter end={stat.val} suffix={stat.suffix} />
                  </div>
                  <div className={`text- font-bold uppercase tracking-widest ${theme.sub}`}>
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}