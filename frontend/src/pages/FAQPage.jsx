import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  ChevronDown, HelpCircle, Search, Ticket, Trophy, 
  Users, Shield, Megaphone, CreditCard, Mail 
} from 'lucide-react';

const FAQS = [
  {
    category: 'Billets & Événements',
    icon: Ticket,
    color: '#6c47ff',
    items: [
      {
        q: 'Comment acheter un billet sur TICKOFIESTA ?',
        a: 'Rendez-vous sur la page d\'un événement, choisissez le type de billet et la quantité, puis cliquez sur "Acheter". Votre billet avec QR Code unique est généré instantanément et disponible dans "Mes billets".',
      },
      {
        q: 'Où retrouver mes billets après achat ?',
        a: 'Vos billets sont accessibles dans la section "Mes billets" de votre compte, accessible depuis le menu en haut à droite. Vous pouvez les consulter et les présenter à l\'entrée de l\'événement.',
      },
      {
        q: 'Comment fonctionne le QR Code à l\'entrée ?',
        a: 'Chaque billet génère un QR Code unique et ultra-sécurisé. À l\'entrée de l\'événement, l\'organisateur scanne ce code avec l\'application Scanner QR de TICKOFIESTA. Un QR Code ne peut être utilisé qu\'une seule fois — toute tentative de réutilisation est immédiatement détectée.',
      },
      {
        q: 'Puis-je transférer mon billet à quelqu\'un d\'autre ?',
        a: 'Les billets sont nominatifs et liés à votre compte pour des raisons de sécurité. Le transfert n\'est pas autorisé sur la plateforme. En cas de besoin exceptionnel, contactez notre support.',
      },
    ],
  },
  {
    category: 'Votes & Concours',
    icon: Trophy,
    color: '#f5a623',
    items: [
      {
        q: 'Comment fonctionne la commission sur les votes ?',
        a: 'TICKOFIESTA applique un modèle de partage de revenus (Revenue Share) simple et transparent de 20% sur le montant total des votes générés. Vous percevez ainsi 80% du chiffre d\'affaires de vos concours de manière nette.',
      },
      {
        q: 'Pourquoi la commission est-elle fixée à 20% ?',
        a: 'Ce taux est "Tout Inclus". Il couvre l\'intégralité des frais de transaction Mobile Money (Wave, Orange, MTN) et bancaires, l\'infrastructure de vote en temps réel capable de supporter des milliers de connexions simultanées, ainsi que nos systèmes avancés de protection anti-fraude.',
      },
      {
        q: 'Qu\'est-ce que le système de "Packs de Votes" ?',
        a: 'Pour maximiser votre rentabilité et simplifier l\'expérience utilisateur, les votes ne s\'achètent pas à l\'unité mais par packs (ex: Pack Fan à 2 000 FCFA pour 25 votes). Cela réduit les frais de transaction et encourage les fans à soutenir davantage leurs candidats favoris.',
      },
      {
        q: 'Comment sont reversés les revenus des votes ?',
        a: 'Tout comme pour la billetterie, les revenus issus des votes sont centralisés sur votre tableau de bord. Ils vous sont reversés par virement bancaire ou Mobile Money 48h après la clôture officielle de votre concours.',
      },
    ],
  },
  {
    category: 'Tarifs & Organisateurs',
    icon: Users,
    color: '#00d4aa',
    items: [
      {
        q: 'Combien coûte la création d\'un événement ?',
        a: 'La création d\'un événement est 100% gratuite. TICKOFIESTA prélève uniquement une commission sur les billets effectivement vendus. De plus, pour vous souhaiter la bienvenue, votre tout premier événement est à 0% de commission (entièrement offert) !',
      },
      {
        q: 'Comment fonctionne le système de commission ?',
        a: 'Notre modèle est transparent et dégressif. Il comprend un pourcentage basé sur votre volume de ventes, plus une part fixe de 200 FCFA par billet pour couvrir nos frais techniques incompressibles (génération sécurisée, envois SMS/Email, serveurs) :\n\n• 1er événement : 0% + 0 FCFA (Offert)\n• Jusqu\'à 500 000 FCFA générés : 5% + 200 FCFA / billet\n• De 500 001 à 2 000 000 FCFA : 3,5% + 200 FCFA / billet\n• Au-delà de 2 000 000 FCFA : 2% + 200 FCFA / billet\n\nPlus votre événement est un succès, plus notre commission baisse.',
      },
      {
        q: 'Dois-je payer cette commission de ma poche ?',
        a: 'Non, c\'est vous qui décidez ! Depuis votre tableau de bord, vous pouvez choisir de faire supporter ces frais de service à l\'acheteur au moment du paiement. Dans ce cas, vous recevez exactement le prix que vous avez fixé pour votre billet, et l\'utilisation de TICKOFIESTA est virtuellement 100% gratuite pour vous.',
      },
      {
        q: 'Comment scanner les billets à l\'entrée ?',
        a: 'Utilisez la fonctionnalité "Scanner QR" disponible dans votre tableau de bord sécurisé. Pointez la caméra de votre smartphone sur le QR Code du billet — la validation est instantanée, même hors ligne (si synchronisé au préalable).',
      },
    ],
  },
  {
    category: 'Publicité & Visibilité',
    icon: Megaphone,
    color: '#ff6b6b',
    items: [
      {
        q: 'Comment booster la visibilité de mon événement ?',
        a: 'Depuis votre espace organisateur, vous pouvez souscrire à nos espaces publicitaires premiums. Nous proposons l\'affichage en "Popup" à l\'ouverture de l\'application (1 000 FCFA/jour) ou la "Bannière défilante" (1 000 FCFA/jour).',
      },
      {
        q: 'Comment fonctionne la rotation des publicités ?',
        a: 'Pour garantir une visibilité équitable, si plusieurs événements font l\'objet d\'une promotion Popup, l\'affichage alterne intelligemment toutes les 8 secondes. Chaque visiteur est ainsi exposé à votre événement.',
      },
    ],
  },
  {
    category: 'Paiement & Sécurité',
    icon: CreditCard,
    color: '#0ea5e9',
    items: [
      {
        q: 'Quels sont les moyens de paiement acceptés ?',
        a: 'TICKOFIESTA prend en charge les moyens de paiement les plus populaires en Côte d\'Ivoire : Mobile Money (Wave, Orange Money, MTN, Moov) ainsi que les paiements par Carte Bancaire Visa/Mastercard via nos partenaires financiers certifiés PCI-DSS.',
      },
      {
        q: 'Quand est-ce que je reçois l\'argent de mes ventes ?',
        a: 'Afin de garantir la sécurité des acheteurs, les fonds sont bloqués sur un compte séquestre. Ils sont ensuite virés automatiquement sur votre compte bancaire ou Mobile Money 48h après la clôture officielle et réussie de votre événement.',
      },
    ],
  },
  {
    category: 'Mon Compte',
    icon: Shield,
    color: '#8b5cf6',
    items: [
      {
        q: 'Comment créer un compte Organisateur ?',
        a: 'Cliquez sur "S\'inscrire" en haut de la page. Créez un compte classique, puis depuis les paramètres de votre profil, activez le mode "Organisateur". L\'accès au tableau de bord professionnel est immédiat.',
      },
      {
        q: 'Mon événement doit-il être validé ?',
        a: 'Oui. Afin de maintenir une qualité premium sur TICKOFIESTA et d\'éviter les fraudes, chaque nouvel événement est examiné par notre équipe de modération avant d\'être rendu public.',
      },
    ],
  },
];

// --- COMPOSANT ACCORDÉON ---
function FAQAccordion({ q, a, dark }) {
  const [open, setOpen] = useState(false);
  
  const text = dark ? 'text-white' : 'text-slate-900';
  const sub = dark ? 'text-slate-400' : 'text-slate-600';
  const card = dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200';
  const hover = dark ? 'hover:bg-white/10' : 'hover:bg-slate-50';

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${card} overflow-hidden ${open ? 'border-[#6c47ff]/50 shadow-[0_0_15px_rgba(108,71,255,0.1)]' : ''}`}>
      <button 
        onClick={() => setOpen(!open)} 
        className={`w-full flex items-center justify-between p-5 text-left gap-4 transition-colors ${hover}`}
      >
        <span className={`font-bold text-sm leading-snug ${text}`}>{q}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-[#6c47ff] text-white' : (dark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
          <ChevronDown size={16} className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className={`px-5 pb-6 text-sm leading-relaxed whitespace-pre-line ${sub}`}>
            {a}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PAGE PRINCIPALE ---
export default function FAQPage() {
  const { dark } = useSelector((s) => s.theme);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const bg = dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]';
  const text = dark ? 'text-white' : 'text-slate-900';
  const sub = dark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200';
  const inputBg = dark ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-[#6c47ff]/50' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#6c47ff]/50';

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return FAQS.map(section => ({
      ...section,
      items: section.items.filter(item =>
        !query || item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
      ),
    })).filter(section =>
      (!activeCategory || section.category === activeCategory) && section.items.length > 0
    );
  }, [search, activeCategory]);

  const totalResults = filtered.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className={`min-h-screen ${bg} pb-24`}>
      
      {/* HERO SECTION */}
      <div className={`relative overflow-hidden pt-32 pb-20 ${dark ? 'border-b border-white/5' : 'bg-white border-b border-slate-200'}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-[#6c47ff]/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#6c47ff]/10 border border-[#6c47ff]/20 rounded-full px-4 py-1.5 mb-6">
            <HelpCircle size={14} className="text-[#6c47ff]" />
            <span className="text-[10px] font-black text-[#6c47ff] uppercase tracking-[0.2em]">Centre d'Assistance</span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-6 ${text}`}>
            Comment pouvons-nous vous <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">aider ?</span>
          </h1>
          <p className={`text-sm md:text-base max-w-xl mx-auto mb-10 ${sub}`}>
            Recherchez parmi nos guides ou explorez les catégories pour trouver les réponses à vos questions.
          </p>

          <div className="relative max-w-2xl mx-auto group">
            <div className={`absolute inset-0 bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
            <div className={`relative flex items-center gap-3 border rounded-2xl px-6 py-4 shadow-xl backdrop-blur-xl ${inputBg}`}>
              <Search size={20} className={search ? 'text-[#6c47ff]' : sub} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tapez votre question ici (ex: Tarifs, Remboursement...)"
                className="flex-1 bg-transparent text-base focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                  <span className={`text-xs font-bold ${sub}`}>Effacer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* SIDEBAR FILTRES */}
          <div className={`lg:w-1/3 flex-shrink-0 ${search && 'hidden lg:block'}`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${text}`}>Explorer par Sujet</h3>
            <div className="flex flex-col gap-3 sticky top-32">
              <button
                onClick={() => setActiveCategory(null)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${!activeCategory ? 'bg-[#6c47ff] border-[#6c47ff] text-white shadow-lg shadow-[#6c47ff]/20' : `${cardBg} ${sub} hover:border-[#6c47ff]/50`}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${!activeCategory ? 'bg-white/20' : (dark ? 'bg-white/5' : 'bg-slate-100')}`}>
                    <Search size={16} />
                  </div>
                  <span className="font-bold text-sm">Toutes les questions</span>
                </div>
              </button>

              {FAQS.map(({ category, icon: Icon, color }) => {
                const isActive = activeCategory === category;
                return (
                  <button 
                    key={category}
                    onClick={() => setActiveCategory(isActive ? null : category)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isActive ? 'border-transparent text-white shadow-lg' : `${cardBg} ${sub} hover:border-[#6c47ff]/50`}`}
                    style={isActive ? { background: `linear-gradient(135deg, ${color}, ${color}dd)` } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors`} style={{ background: isActive ? 'rgba(255,255,255,0.2)' : `${color}20`, color: isActive ? '#fff' : color }}>
                        <Icon size={16} />
                      </div>
                      <span className="font-bold text-sm">{category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:w-2/3">
            {search && (
              <p className={`text-sm font-bold mb-8 ${sub}`}>
                {totalResults} résultat{totalResults > 1 ? 's' : ''} trouvé{totalResults > 1 ? 's' : ''} pour "<span className={text}>{search}</span>"
              </p>
            )}

            {filtered.length === 0 ? (
              <div className={`text-center py-20 px-6 rounded-[2rem] border ${cardBg}`}>
                <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Search size={24} className={sub} />
                </div>
                <p className={`text-xl font-black tracking-tight mb-2 ${text}`}>Aucune réponse trouvée</p>
                <p className={`text-sm mb-6 ${sub}`}>Nous n'avons pas trouvé de réponse correspondant à votre recherche.</p>
                <button onClick={() => setSearch('')} className="text-sm font-bold text-[#6c47ff] hover:underline">
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {filtered.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.category} className="animate-fade-in">
                      {!activeCategory && (
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${section.color}20` }}>
                            <Icon size={14} style={{ color: section.color }} />
                          </div>
                          <h2 className={`text-lg font-black tracking-tight ${text}`}>{section.category}</h2>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {section.items.map((item, i) => (
                          <FAQAccordion key={i} q={item.q} a={item.a} dark={dark} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CARTE CONTACT FALLBACK */}
            <div className={`mt-16 p-8 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-6 ${cardBg}`} style={{ background: dark ? 'linear-gradient(135deg, #12121f, #1a1a2e)' : 'linear-gradient(135deg, #f8f9ff, #f1f5f9)' }}>
              <div>
                <h3 className={`text-xl font-black tracking-tight mb-2 ${text}`}>Toujours bloqué ?</h3>
                <p className={`text-sm ${sub}`}>Notre équipe d'experts est disponible pour vous assister.</p>
              </div>
              <a href="mailto:contact@tickofiesta.com" className="shrink-0 flex items-center gap-2 bg-[#6c47ff] hover:bg-[#5a3ae6] text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-[#6c47ff]/25">
                <Mail size={16} /> Nous Contacter
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}