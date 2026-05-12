import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const { dark } = useSelector((s) => s.theme);
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Comment publier un événement sur Tickofiesta ?',
      a: 'Créez un compte, cliquez sur "Publier un événement" dans la navbar, remplissez les infos : titre, date, lieu, prix, visuel. Vous pouvez publier gratuitement avec 1 événement/mois sur le plan Gratuit.'
    },
    {
      q: 'Quelles sont les commissions sur les ventes de billets ?',
      a: 'Plan Gratuit : 8% par billet vendu. Plan Pro : 5%. Plan Entreprise : commission négociable. Aucun frais fixe mensuel sur le plan Gratuit.'
    },
    {
      q: 'Quand suis-je payé pour mes ventes ?',
      a: 'Les paiements sont versés 7 jours après la fin de votre événement, directement sur votre compte Mobile Money ou bancaire configuré dans votre dashboard.'
    },
    {
      q: 'Puis-je annuler ou rembourser un participant ?',
      a: 'Oui, depuis votre dashboard organisateur. Les remboursements sont traités sous 3-5 jours ouvrés. Vous pouvez définir votre politique d\'annulation par événement.'
    },
    {
      q: 'Quels moyens de paiement acceptez-vous ?',
      a: 'Orange Money, MTN Mobile Money, Moov Money, Wave, cartes Visa/Mastercard, et virement bancaire pour les plans Entreprise.'
    },
    {
      q: 'Comment scanner les billets le jour J ?',
      a: 'Utilisez l\'app mobile Tickofiesta Scanner (iOS/Android) ou le scanner web. Chaque billet a un QR code unique. Mode hors-ligne disponible.'
    },
    {
      q: 'Puis-je personnaliser ma page événement ?',
      a: 'Oui sur le plan Pro : couleurs, logo, bannière, domaine personnalisé. Le plan Gratuit utilise le template standard.'
    },
    {
      q: 'Que se passe-t-il si mon événement est annulé ?',
      a: 'Vous pouvez annuler depuis le dashboard. Tous les participants sont remboursés automatiquement à 100%. Tickofiesta ne prélève aucune commission sur les événements annulés.'
    }
  ];

  return (
    <div className={`min-h-screen pt-32 pb-20 ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] mb-6">
            <HelpCircle size={32} className="text-white" />
          </div>
          <h1 className={`text-5xl font-black mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Questions <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">fréquentes</span>
          </h1>
          <p className={`text-lg ${dark ? 'text-white/60' : 'text-gray-600'}`}>
            Tout ce que vous devez savoir sur Tickofiesta
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`rounded-2xl border backdrop-blur-xl overflow-hidden transition-all ${
                dark ? 'border-white/10 bg-[#12121f]/60' : 'border-gray-200 bg-white'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>{faq.q}</span>
                <ChevronDown
                  size={24}
                  className={`flex-shrink-0 transition-transform ${
                    openIndex === i ? 'rotate-180 text-[#6c47ff]' : dark ? 'text-white/40' : 'text-gray-400'
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className={`px-6 pb-6 ${dark ? 'text-white/70' : 'text-gray-700'} leading-relaxed`}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={`mt-12 p-8 rounded-2xl text-center ${
          dark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
        }`}>
          <p className={`mb-4 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
            Vous ne trouvez pas votre réponse ?
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] shadow-lg shadow-[#6c47ff]/30 hover:shadow-[#6c47ff]/50 transition-all"
          >
            Contactez-nous
          </Link>
        </div>
      </div>
    </div>
  );
}