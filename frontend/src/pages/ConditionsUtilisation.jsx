import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function ConditionsUtilisation() {
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
          <h1 className={`text-3xl sm:text-5xl font-black tracking-tighter ${theme.text}`}>Conditions Générales d'Utilisation</h1>
          <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${dark ? 'text-[#00d4aa]' : 'text-[#6c47ff]'}`}>
            Mise à jour : Mai 2026
          </p>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <section id="acceptation-conditions" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>1. Acceptation des conditions</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>En accédant et en utilisant la plateforme TICKOFIESTA, vous acceptez sans réserve les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>
        </section>

        <section id="description-service" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>2. Description du service</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>TICKOFIESTA est une plateforme numérique de billetterie et de votes en ligne permettant aux organisateurs de gérer des événements et au public d'acheter des billets sécurisés par QR Code.</p>
        </section>

        <section id="inscription-compte" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>3. Inscription et compte</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>Vous vous engagez à fournir des informations exactes. La confidentialité de vos identifiants est sous votre responsabilité.</p>
        </section>

        <section id="achat-billets" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>4. Achat de billets</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>Les billets sont nominatifs et non remboursables sauf annulation de l'événement par l'organisateur.</p>
        </section>

        <section id="responsabilite-organisateurs" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>5. Responsabilité des organisateurs</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>Les organisateurs sont seuls responsables du contenu et du déroulement de leurs événements. TICKOFIESTA agit uniquement en tant qu'intermédiaire technique.</p>
        </section>

        <section id="commissions-paiements" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>6. Commissions et paiements</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>TICKOFIESTA prélève une commission sur chaque vente. Le premier événement est exonéré de commission. Les taux sont dégressifs selon le montant généré.</p>
        </section>

        <section id="votes-concours" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>7. Votes et concours</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>Toute tentative de manipulation des votes entraîne la suspension immédiate du compte.</p>
        </section>

        <section id="propriete-intellectuelle" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>8. Propriété intellectuelle</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>Tout le contenu de la plateforme TICKOFIESTA est protégé par les droits de propriété intellectuelle.</p>
        </section>

        <section id="limitation-responsabilite" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>10. Limitation de responsabilité</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>La responsabilité de TICKOFIESTA est limitée aux montants des transactions effectuées.</p>
        </section>

        <section id="droit-applicable" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <h2 className={`font-black text-xl mb-4 ${theme.text}`}>11. Droit applicable</h2>
          <p className={`text-sm leading-relaxed ${theme.sub}`}>Les présentes conditions sont régies par le droit ivoirien. Tout litige sera soumis à la juridiction compétente d'Abidjan.</p>
        </section>
      </div>
    </div>
  );
}