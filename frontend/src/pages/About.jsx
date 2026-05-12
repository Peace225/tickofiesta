import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom'; // ← Ajouté
import { Zap, Target, Users, Globe } from 'lucide-react';

export default function About() {
  const { dark } = useSelector((s) => s.theme);

  const values = [
    {
      icon: Zap,
      title: 'Simplicité',
      desc: 'Publier un événement en moins de 2 minutes. Pas de jargon, pas de friction.'
    },
    {
      icon: Target,
      title: 'Transparence',
      desc: 'Commissions claires, paiements rapides, analytics en temps réel. Zéro surprise.'
    },
    {
      icon: Users,
      title: 'Communauté',
      desc: 'Connecter les organisateurs et le public ivoirien. Promouvoir la culture locale.'
    },
    {
      icon: Globe,
      title: 'Accessibilité',
      desc: 'Mobile Money pour tous. Pas besoin de carte bancaire pour participer.'
    }
  ];

  return (
    <div className={`min-h-screen pt-32 pb-20 ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-20">
          <h1 className={`text-5xl font-black mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Qui <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">sommes-nous</span> ?
          </h1>
          <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${dark ? 'text-white/70' : 'text-gray-600'}`}>
            Tickofiesta est né en 2024 à Abidjan d'un constat simple : organiser un événement en Côte d'Ivoire 
            ne devrait pas être un parcours du combattant.
          </p>
        </div>

        <div className={`rounded-3xl p-12 mb-20 backdrop-blur-xl border ${
          dark ? 'bg-[#12121f]/60 border-white/10' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-3xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Notre mission</h2>
          <p className={`text-lg leading-relaxed mb-6 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
            Démocratiser l'événementiel en Afrique de l'Ouest. Donner à chaque créateur, artiste, entrepreneur 
            ou association les outils pour vendre des billets en ligne, sans technique, sans frais cachés.
          </p>
          <p className={`text-lg leading-relaxed ${dark ? 'text-white/80' : 'text-gray-700'}`}>
            Aujourd'hui, +500 organisateurs nous font confiance. Concerts, conférences, formations, mariages, 
            matchs... Plus de 50 000 billets vendus depuis le lancement.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <div
                key={i}
                className={`p-8 rounded-2xl border backdrop-blur-xl ${
                  dark ? 'bg-[#12121f]/60 border-white/10' : 'bg-white border-gray-200'
                }`}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] flex items-center justify-center mb-4">
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>{value.title}</h3>
                <p className={dark ? 'text-white/70' : 'text-gray-600'}>{value.desc}</p>
              </div>
            );
          })}
        </div>

        <div className={`text-center p-12 rounded-3xl ${
          dark ? 'bg-gradient-to-r from-[#6c47ff]/20 to-[#00d4aa]/20 border border-[#6c47ff]/30' : 'bg-gradient-to-r from-[#6c47ff]/10 to-[#00d4aa]/10'
        }`}>
          <h2 className={`text-3xl font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Rejoignez le mouvement
          </h2>
          <p className={`text-lg mb-8 ${dark ? 'text-white/70' : 'text-gray-600'}`}>
            +500 organisateurs. 50 000+ billets vendus. Et ce n'est que le début.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] shadow-lg shadow-[#6c47ff]/30 hover:shadow-[#6c47ff]/50 hover:scale-105 transition-all"
          >
            Créer mon compte gratuit
          </Link>
        </div>
      </div>
    </div>
  );
}