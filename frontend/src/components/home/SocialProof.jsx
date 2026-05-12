import { useSelector } from 'react-redux';
import { Star, Quote, Sparkles, TrendingUp, Shield, Zap, Users, CheckCircle2 } from 'lucide-react';
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

  // Thème affiné pour un rendu "Premium Glassmorphism"
  const theme = {
    card: dark
      ? 'bg-[#12121f]/60 backdrop-blur-2xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
      : 'bg-white/80 backdrop-blur-2xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    glow: dark 
      ? 'hover:shadow-[0_0_40px_rgba(108,71,255,0.15)] hover:border-white/10 hover:bg-[#12121f]/80' 
      : 'hover:shadow-[0_20px_40px_rgba(108,71,255,0.08)] hover:border-[#6c47ff]/20',
  };

  const testimonials = [
    {
      id: 1,
      name: "Marc-Arthur Kouamé",
      role: "Organisateur de Festivals",
      image: "https://i.pravatar.cc/150?u=marc",
      text: "La plateforme a complètement transformé la gestion de nos événements à Abidjan. La billetterie est fluide, et le tableau de bord nous donne un contrôle total en temps réel. Un service ultra-premium !",
      rating: 5,
      badge: "Top Organisateur"
    },
    {
      id: 2,
      name: "Aya Konan",
      role: "Participante fidèle",
      image: "https://i.pravatar.cc/150?u=aya",
      text: "Je n'ai jamais vu un site aussi simple pour acheter mes tickets de concert et voter pour mes artistes préférés. La réception du QR code est instantanée, c'est la magie !",
      rating: 5,
      badge: "Membre VIP"
    },
    {
      id: 3,
      name: "Cissé Ibrahim",
      role: "Promoteur de Concours",
      image: "https://i.pravatar.cc/150?u=cisse",
      text: "Pour nos compétitions de talents, le module de vote est parfait. Sécurisé, transparent, et le versement des revenus est toujours ponctuel. On ne travaille plus qu'avec eux.",
      rating: 5,
      badge: "Partenaire Pro"
    }
  ];

  const stats = [
    { val: "500+", label: "Événements", icon: Sparkles, color: "from-[#6c47ff] to-[#8b6bff]" },
    { val: "50K+", label: "Tickets Vendus", icon: TrendingUp, color: "from-[#00d4aa] to-[#00f5c4]" },
    { val: "100%", label: "Sécurisé SSL", icon: Shield, color: "from-[#f5a623] to-[#fbbf24]" },
    { val: "24/7", label: "Support Local", icon: Zap, color: "from-red-500 to-red-600" },
  ];

  return (
    <section ref={sectionRef} className="relative w-full py-20 md:py-32 overflow-hidden">
      
      {/* Arrière-plan premium avec textures et orbes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* CORRECTION : blur-3xl */}
        <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-[#6c47ff]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-[-10%] w-[500px] h-[500px] bg-[#00d4aa]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grille d'ingénierie subtile */}
        <div 
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: `linear-gradient(${dark ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${dark ? '#fff' : '#000'} 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">

        {/* En-tête de section */}
        <div className={`text-center max-w-3xl mx-auto mb-16 md:mb-24 transition-all duration-1000 transform-gpu ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6c47ff]/10 to-[#00d4aa]/10 border border-[#6c47ff]/20 backdrop-blur-xl px-4 py-1.5 rounded-full mb-6 shadow-[0_0_20px_rgba(108,71,255,0.15)]">
            <Star size={14} className="text-[#f5a623] animate-pulse" fill="currentColor" />
            {/* CORRECTION : text-[10px] md:text-[11px] */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-[10px] md:text-[11px] font-black tracking-[0.25em] uppercase">
              Ils nous font confiance
            </span>
          </div>
          <h2 className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-tight ${theme.text}`}>
            La référence des{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] via-[#8b6bff] to-[#00d4aa] drop-shadow-[0_0_40px_rgba(108,71,255,0.3)]">
              événements
            </span>
          </h2>
          <p className={`text-base md:text-xl font-medium leading-relaxed max-w-2xl mx-auto ${theme.sub}`}>
            Découvrez pourquoi les meilleurs organisateurs et le public choisissent notre plateforme pour leurs moments inoubliables.
          </p>
        </div>

        {/* Cartes de témoignages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-32">
          {testimonials.map((item, i) => (
            <div
              key={item.id}
              // CORRECTION : rounded-3xl
              className={`relative p-8 md:p-10 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] group transform-gpu ${theme.card} ${theme.glow} ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Badge flottant au survol */}
              {/* CORRECTION : text-[10px] */}
              <div className="absolute -top-4 right-6 bg-gradient-to-r from-[#f5a623] to-[#fbbf24] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_8px_16px_rgba(245,166,35,0.4)] opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                {item.badge}
              </div>

              {/* Guillemet décoratif */}
              <Quote size={56} className="absolute top-6 left-6 text-[#6c47ff]/5 group-hover:text-[#6c47ff]/10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-6">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={18} className="text-[#f5a623] drop-shadow-[0_0_8px_rgba(245,166,35,0.6)]" fill="currentColor" />
                  ))}
                </div>

                <p className={`text-base md:text-lg leading-relaxed mb-10 font-medium italic ${theme.text}`}>
                  "{item.text}"
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-inherit border-opacity-10">
                  <div className="relative">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 rounded-2xl object-cover shadow-xl ring-2 ring-[#6c47ff]/20 group-hover:ring-[#6c47ff]/60 transition-all duration-300" 
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0f0e1a] flex items-center justify-center shadow-lg">
                      <CheckCircle2 size={12} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className={`text-sm md:text-base font-black uppercase tracking-wider ${theme.text}`}>{item.name}</h4>
                    {/* CORRECTION : text-[10px] */}
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${theme.sub}`}>{item.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistiques (Design Tableau de Bord) */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-10 transition-all duration-1000 transform-gpu ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} 
          style={{ transitionDelay: '500ms' }}
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="group relative">
                {/* Lueur d'arrière-plan au survol */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 rounded-3xl pointer-events-none`} />
                
                <div className={`relative rounded-3xl border p-6 md:p-8 text-center transition-all duration-300 hover:-translate-y-2 ${theme.card}`}>
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon size={26} className="text-white md:w-8 md:h-8" />
                  </div>
                  <p className={`text-3xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r ${stat.color} drop-shadow-sm`}>
                    {stat.val}
                  </p>
                  {/* CORRECTION : text-[10px] md:text-xs */}
                  <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${theme.sub}`}>
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}