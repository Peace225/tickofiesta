import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Confidentialite() {
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
          <h1 className={`text-3xl sm:text-5xl font-black tracking-tighter ${theme.text}`}>Politique de Confidentialité</h1>
          <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${dark ? 'text-[#00d4aa]' : 'text-[#6c47ff]'}`}>
            Dernière mise à jour : Mai 2026
          </p>
        </div>
      </div>

      {/* CONTENU - Spécifiquement formaté pour Google */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <section id="politique-confidentialite" className={`rounded-[2rem] p-8 ${theme.card}`}>
          <div className="flex items-start gap-4">
            <div className={`mt-1 shrink-0 ${dark ? 'text-[#6c47ff]' : 'text-[#6c47ff]'}`}>
              <Shield size={24} />
            </div>
            <div>
              <h2 className={`font-black text-xl mb-4 ${theme.text}`}>Protection de vos données personnelles</h2>
              <p className={`text-sm leading-relaxed ${theme.sub} mb-4`}>
                La protection de vos données personnelles est primordiale pour TICKOFIESTA. Lorsque vous vous connectez via des services tiers (comme Google ou Facebook), nous collectons uniquement les informations nécessaires à votre identification : votre nom, votre adresse e-mail et votre photo de profil publique.
              </p>
              <p className={`text-sm leading-relaxed ${theme.sub} mb-4`}>
                Ces données sont utilisées exclusivement pour gérer votre compte, sécuriser vos achats de billets et vos votes. Nous ne vendons, ne louons ni ne cédons jamais vos données personnelles à des tiers à des fins commerciales.
              </p>
              <p className={`text-sm leading-relaxed ${theme.sub} mb-4`}>
                Vos mots de passe (si créés manuellement) sont cryptés. Conformément à la législation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données en contactant notre support.
              </p>
              <p className={`text-sm leading-relaxed ${theme.sub}`}>
                Pour toute question relative à vos données, contactez :{' '}
                <a href="mailto:contact@tickofiesta.com" className="text-[#6c47ff] font-bold hover:underline">
                  contact@tickofiesta.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}