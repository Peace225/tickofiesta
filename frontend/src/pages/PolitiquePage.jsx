import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Acceptation des conditions',
    content: `En accédant et en utilisant la plateforme TICKOFIESTA, vous acceptez sans réserve les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service. TICKOFIESTA se réserve le droit de modifier ces conditions à tout moment. Les modifications prennent effet dès leur publication sur la plateforme.`,
  },
  {
    title: '2. Description du service',
    content: `TICKOFIESTA est une plateforme numérique de billetterie et de votes en ligne permettant aux organisateurs de créer et gérer des événements, aux clients d'acheter des billets électroniques sécurisés, et au public de participer à des concours de votes. Chaque billet généré est unique, sécurisé par un QR Code et une référence de transaction.`,
  },
  {
    title: '3. Inscription et compte utilisateur',
    content: `Pour utiliser certaines fonctionnalités de la plateforme, vous devez créer un compte. Vous vous engagez à fournir des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité effectuée depuis votre compte est sous votre responsabilité. TICKOFIESTA se réserve le droit de suspendre ou supprimer tout compte en cas d'utilisation frauduleuse ou contraire aux présentes conditions.`,
  },
  {
    title: '4. Achat de billets',
    content: `Les billets achetés sur TICKOFIESTA sont nominatifs et non remboursables sauf annulation de l'événement par l'organisateur. Chaque billet est généré avec un QR Code unique servant de titre d'entrée. La revente de billets est strictement interdite. En cas de perte de votre billet numérique, vous pouvez le retrouver dans la section "Mes billets" de votre compte.`,
  },
  {
    title: '5. Responsabilité des organisateurs',
    content: `Les organisateurs sont seuls responsables du contenu de leurs événements, de leur organisation et de leur déroulement. TICKOFIESTA agit uniquement en tant qu'intermédiaire technique. En cas d'annulation d'un événement, l'organisateur s'engage à en informer TICKOFIESTA dans les meilleurs délais afin que les mesures appropriées soient prises pour les acheteurs.`,
  },
  {
    title: '6. Commissions et paiements',
    content: `TICKOFIESTA prélève une commission sur chaque vente de billet. Le premier événement de chaque organisateur est exonéré de commission (0%). À partir du deuxième événement, une commission dégressive est appliquée selon le montant total généré : 5% de 0 à 500 000 FCFA, 3,5% de 500 001 à 2 000 000 FCFA, et 2% au-delà de 2 000 000 FCFA. Plus l'événement rapporte, moins la commission est élevée. Ces taux sont susceptibles d'évoluer.`,
  },
  {
    title: '7. Votes et concours',
    content: `Les concours de votes organisés sur TICKOFIESTA sont soumis aux règles spécifiques de chaque événement. TICKOFIESTA ne garantit pas les résultats des votes et ne peut être tenu responsable de contestations liées aux résultats. Toute tentative de manipulation des votes (votes automatisés, fraude) entraîne la suspension immédiate du compte.`,
  },
  {
    title: '8. Propriété intellectuelle',
    content: `Tout le contenu de la plateforme TICKOFIESTA (logo, design, code, textes) est protégé par les droits de propriété intellectuelle. Les organisateurs conservent les droits sur les images et contenus qu'ils publient, mais accordent à TICKOFIESTA une licence d'utilisation pour l'affichage sur la plateforme.`,
  },
  {
    title: '9. Politique de Confidentialité (Protection des données)',
    content: `La protection de vos données personnelles est primordiale pour TICKOFIESTA. Lorsque vous vous connectez via des services tiers (comme Google ou Facebook), nous collectons uniquement les informations nécessaires à votre identification : votre nom, votre adresse e-mail et votre photo de profil publique. Ces données sont utilisées exclusivement pour gérer votre compte, sécuriser vos achats de billets et vos votes. Nous ne vendons, ne louons ni ne cédons jamais vos données personnelles à des tiers à des fins commerciales. Vos mots de passe (si créés manuellement) sont cryptés. Conformément à la législation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en contactant notre support.`,
  },
  {
    title: '10. Limitation de responsabilité',
    content: `TICKOFIESTA ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme, des événements annulés ou modifiés par les organisateurs, ou de tout problème technique indépendant de notre volonté. La responsabilité de TICKOFIESTA est limitée aux montants des transactions effectuées.`,
  },
  {
    title: '11. Droit applicable',
    content: `Les présentes conditions sont régies par le droit ivoirien. Tout litige relatif à l'utilisation de TICKOFIESTA sera soumis à la juridiction compétente d'Abidjan, Côte d'Ivoire. En cas de litige, une résolution amiable sera privilégiée avant tout recours judiciaire.`,
  },
];

export default function PolitiquePage() {
  const { dark } = useSelector((s) => s.theme);
  
  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#fafafe]',
    text: dark ? 'text-[#e8e6ff]' : 'text-gray-900',
    sub: dark ? 'text-[#8b87b8]' : 'text-gray-500',
    card: dark ? 'bg-[#0f0e1a]/80 backdrop-blur-xl border border-[rgba(108,71,255,0.15)] shadow-2xl' : 'bg-white border border-gray-100 shadow-xl',
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme.bg}`}>
      
      {/* HERO SECTION */}
      <div className="relative overflow-hidden py-16 pt-24 border-b" style={{ background: dark ? 'linear-gradient(135deg, #0d0221, #1a0533)' : 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <Link to="/" className={`inline-flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest ${dark ? 'text-white/50' : 'text-gray-400'}`}>
            <ArrowLeft size={12} /> Retour à l'accueil
          </Link>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6c47ff] to-[#8b6bff] flex items-center justify-center shadow-lg shrink-0">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className={`text-3xl sm:text-5xl font-black tracking-tighter ${theme.text}`}>Conditions d'utilisation</h1>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${dark ? 'text-[#00d4aa]' : 'text-[#6c47ff]'}`}>
                Mise à jour : Mai 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {SECTIONS.map((s, i) => (
            <div 
              key={i} 
              className={`rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 transition-all ${theme.card}`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 shrink-0 ${dark ? 'text-[#6c47ff]' : 'text-[#6c47ff]'}`}>
                  <CheckCircle size={18} />
                </div>
                <div>
                  <h2 className={`font-black text-[17px] sm:text-lg mb-2 leading-snug tracking-tight ${theme.text}`}>{s.title}</h2>
                  <p className={`text-xs sm:text-sm leading-relaxed font-medium ${theme.sub}`}>{s.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER CONTACT */}
        <div className={`mt-8 rounded-[1.5rem] p-6 text-center ${theme.card}`}>
          <p className={`text-xs font-medium ${theme.sub}`}>
            Questions ? Contactez-nous :{' '}
            <a href="mailto:contact@tickofiesta.com" className="text-[#6c47ff] font-black hover:underline block sm:inline mt-2 sm:mt-0">
              contact@tickofiesta.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}