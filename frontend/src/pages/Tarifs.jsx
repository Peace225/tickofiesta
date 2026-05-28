import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Check, Zap, Crown, Building2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

const ICON_MAP = { Zap, Crown, Building2 };

export default function Tarifs() {
  const { dark } = useSelector((s) => s.theme);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTarifs = async () => {
      const { data } = await supabase.from('tarifs').select('*').eq('is_active', true).order('id');
      if (data) setPlans(data);
      setLoading(false);
    };
    fetchTarifs();
  }, []);

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 ${dark ? 'bg-[#050507]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE ÉLÉGANT */}
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#6c47ff]/10 text-[#6c47ff] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-[#6c47ff]/20">
            <Sparkles size={12} /> Plans Premium
          </div>
          <h1 className={`text-5xl md:text-6xl font-black tracking-tighter ${dark ? 'text-white' : 'text-slate-900'}`}>
            Tarification transparente
          </h1>
          <p className={`text-lg max-w-xl mx-auto ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Choisissez le plan qui propulse vos événements au niveau supérieur.
          </p>
        </div>

        {/* GRILLE DES TARIFS */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = ICON_MAP[plan.icon_name] || Zap;
            return (
              <div
                key={plan.name || index}
                className={`group relative rounded-[2rem] p-8 border backdrop-blur-xl transition-all duration-500 hover:-translate-y-4 ${
                  plan.popular
                    ? 'border-[#6c47ff] bg-[#6c47ff]/5 shadow-2xl shadow-[#6c47ff]/20'
                    : dark ? 'border-white/5 bg-[#0b0a1a]' : 'border-slate-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Recommandé
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plan.popular ? 'bg-[#6c47ff] text-white' : 'bg-slate-100 dark:bg-slate-800 text-[#6c47ff]'}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-widest opacity-60 ${dark ? 'text-white' : 'text-slate-500'}`}>{plan.description}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <span className={`text-5xl font-black ${dark ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                  {plan.price !== 'Sur devis' && <span className="ml-2 font-bold opacity-60">FCFA</span>}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-semibold opacity-80">
                      <div className="w-5 h-5 rounded-full bg-[#00d4aa]/20 flex items-center justify-center">
                        <Check size={12} className="text-[#00d4aa]" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to="/register" className={`block w-full py-4 rounded-2xl text-center font-black transition-all ${
                  plan.popular 
                    ? 'bg-[#6c47ff] text-white hover:bg-[#5b3ce6]' 
                    : 'bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white'
                }`}>
                  Choisir ce plan
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}