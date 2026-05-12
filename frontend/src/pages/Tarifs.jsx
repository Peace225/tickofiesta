import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Check, Zap, Crown, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient'; // Ajuste le chemin si nécessaire

// Dictionnaire pour mapper les noms d'icônes en texte (depuis Supabase) vers les composants React
const ICON_MAP = {
  Zap: Zap,
  Crown: Crown,
  Building2: Building2
};

// Tarifs par défaut (Fallback si Supabase échoue ou charge)
const DEFAULT_PLANS = [
  {
    name: 'Gratuit',
    price: '0',
    icon_name: 'Zap',
    description: 'Pour tester la plateforme',
    features: [
      'Publier 1 événement/mois',
      "Jusqu'à 50 participants",
      'Page événement basique',
      'Support par email',
      'Commission 8% sur les ventes'
    ],
    cta: 'Commencer',
    popular: false
  },
  {
    name: 'Pro',
    price: '19 000',
    icon_name: 'Crown',
    description: 'Pour les organisateurs réguliers',
    features: [
      'Événements illimités',
      'Participants illimités',
      'Personnalisation avancée',
      'Analytics détaillées',
      'Support prioritaire 24/7',
      'Commission 5% sur les ventes',
      'QR codes personnalisés'
    ],
    cta: 'Essayer Pro',
    popular: true
  },
  {
    name: 'Entreprise',
    price: 'Sur devis',
    icon_name: 'Building2',
    description: 'Solutions sur mesure',
    features: [
      'Tout du plan Pro',
      'Marque blanche',
      'API dédiée',
      'Account manager dédié',
      'Commission négociable',
      'Intégrations personnalisées',
      'SLA garanti'
    ],
    cta: 'Contacter',
    popular: false
  }
];

export default function Tarifs() {
  const { dark } = useSelector((s) => s.theme);
  
  // État pour stocker les plans (initialisé avec les plans par défaut)
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);

  // --- LOGIQUE SUPABASE : RÉCUPÉRATION DES TARIFS ---
  useEffect(() => {
    const fetchTarifs = async () => {
      try {
        const { data, error } = await supabase
          .from('tarifs')
          .select('*')
          .eq('is_active', true)
          .order('id', { ascending: true }); // Optionnel : trier par ID ou par Prix

        if (error) {
          console.warn('Erreur Supabase tarifs:', error.message);
          return;
        }

        // Si on a des données, on remplace le tableau par défaut
        if (data && data.length > 0) {
          setPlans(data);
        }
      } catch (err) {
        console.info("Tarifs non chargés depuis Supabase. Utilisation des valeurs par défaut.");
      } finally {
        setLoading(false);
      }
    };

    fetchTarifs();
  }, []);

  return (
    <div className={`min-h-screen pt-32 pb-20 ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* EN-TÊTE */}
        <div className="text-center mb-16">
          <h1 className={`text-5xl font-black mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Tarifs <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">simples</span>
          </h1>
          <p className={`text-lg ${dark ? 'text-white/60' : 'text-gray-600'}`}>
            Choisissez le plan adapté à vos événements. Sans engagement.
          </p>
        </div>

        {/* GRILLE DES TARIFS */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            // Récupération dynamique de l'icône, ou fallback sur 'Zap' si non trouvée
            const Icon = ICON_MAP[plan.icon_name] || Zap;
            
            return (
              <div
                key={plan.name || index}
                className={`relative rounded-3xl border backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'border-[#6c47ff] shadow-[0_0_60px_rgba(108,71,255,0.3)]'
                    : dark
                    ? 'border-white/10 bg-[#12121f]/60'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* BADGE POPULAIRE */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white text-xs font-bold shadow-lg">
                    POPULAIRE
                  </div>
                )}
                
                <div className="p-8">
                  {/* ICONE ET TITRE */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] flex items-center justify-center shadow-lg">
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-sm ${dark ? 'text-white/50' : 'text-gray-500'}`}>
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* PRIX */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>
                        {plan.price}
                      </span>
                      {plan.price !== 'Sur devis' && (
                        <span className={dark ? 'text-white/60' : 'text-gray-600 font-medium'}>
                          FCFA/mois
                        </span>
                      )}
                    </div>
                  </div>

                  {/* FONCTIONNALITÉS */}
                  <ul className="space-y-4 mb-8">
                    {plan.features && plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check size={20} className="text-[#6c47ff] flex-shrink-0 mt-0.5" />
                        <span className={dark ? 'text-white/80' : 'text-gray-700 font-medium'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* BOUTON D'ACTION */}
                  <Link
                    to="/register"
                    className={`block w-full text-center py-3 rounded-full font-bold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white shadow-lg shadow-[#6c47ff]/30 hover:shadow-[#6c47ff]/50'
                        : dark
                        ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* PIED DE PAGE DES TARIFS */}
        <div className={`mt-16 text-center ${dark ? 'text-white/60' : 'text-gray-500 font-medium'}`}>
          <p>Tous les prix sont en FCFA. TVA non applicable.</p>
        </div>
      </div>
    </div>
  );
}