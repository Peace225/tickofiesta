import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient'; // Assurez-vous du chemin vers votre client supabase
import { ShoppingBag, ArrowUpRight, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientTransactions() {
  const { dark } = useSelector((s) => s.theme);
  const [featuredEventId, setFeaturedEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const theme = {
    bg: dark ? 'bg-[#050508]' : 'bg-slate-50',
    card: dark ? 'bg-[#0A0A12] border-white/5' : 'bg-white border-slate-100',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  };

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        if (data) setFeaturedEventId(data.id);
      } catch (err) {
        console.error("Erreur lors de la récupération de l'événement:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedEvent();
  }, []);

  return (
    <div className={`min-h-screen p-4 md:p-8 animate-in fade-in duration-500 ${theme.bg}`}>
      <div className="max-w-4xl mx-auto">
        
        {/* EN-TÊTE MARKETING */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter ${theme.text}`}>Paiements</h1>
            <p className={`text-sm font-bold tracking-widest uppercase mt-2 ${theme.sub}`}>Suivi de votre activité</p>
          </div>
          <div className={`p-3 rounded-2xl ${dark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
            <TrendingUp className="text-[#6c47ff]" size={24} />
          </div>
        </div>

        {/* SECTION VIDE (Marketing Focused) */}
        <div className={`relative overflow-hidden rounded-[2.5rem] border ${theme.card} p-8 md:p-12 text-center`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6c47ff]/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className={`p-4 rounded-full mb-6 ${dark ? 'bg-[#6c47ff]/20' : 'bg-[#6c47ff]/10'}`}>
              <ShoppingBag size={32} className="text-[#6c47ff]" />
            </div>
            
            <h2 className={`text-2xl font-black mb-3 ${theme.text}`}>Votre historique est vide</h2>
            <p className={`max-w-md text-sm leading-relaxed mb-8 ${theme.sub}`}>
              Il est temps de passer à l'action ! Explorez nos événements exclusifs et vivez des expériences inoubliables.
            </p>
            
            {/* BOUTON DYNAMIQUE */}
            <Link 
              to={featuredEventId ? `/events/${featuredEventId}` : "/events"}
              className="group flex items-center gap-2 bg-gradient-to-r from-[#6c47ff] to-[#00d4aa] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-105 transition-transform shadow-lg shadow-[#6c47ff]/20"
            >
              {featuredEventId ? "Découvrir l'événement" : "Voir tous les événements"}
              <ArrowUpRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}