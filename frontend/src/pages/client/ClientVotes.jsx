import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { Zap, TrendingUp, ChevronRight } from 'lucide-react';

export default function ClientVotes() {
  const { dark } = useSelector((s) => s.theme);
  const navigate = useNavigate();
  
  const [concours, setConcours] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = {
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0A0A12] border-white/10' : 'bg-white border-slate-200',
  };

  useEffect(() => {
    const fetchConcours = async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) console.error("Erreur Supabase:", error);
      setConcours(data || []);
      setLoading(false);
    };
    fetchConcours();
  }, []);

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-3xl font-black tracking-tighter flex items-center gap-2 ${theme.text}`}>
          <Zap className="text-[#f5a623] fill-[#f5a623]" /> Mes Votes
        </h1>
        <p className={`text-xs uppercase font-bold tracking-widest mt-1 ${theme.sub}`}>Historique d'influence</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`p-5 rounded-3xl border ${theme.card}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.sub}`}>Points Dépensés</p>
          <p className={`text-3xl font-black ${theme.text}`}>0</p>
        </div>
        <div className={`p-5 rounded-3xl border ${theme.card}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${theme.sub}`}>Concours</p>
          <p className={`text-3xl font-black ${theme.text}`}>{concours.length}</p>
        </div>
      </div>

      <h2 className={`text-sm font-black uppercase tracking-widest mb-4 ${theme.text}`}>Concours en cours</h2>
      
      {loading ? (
        <div className="text-center py-10">Chargement...</div>
      ) : concours.length > 0 ? (
        <div className="space-y-4">
          {concours.map((c) => (
            <div key={c.id} className={`p-4 rounded-2xl border ${theme.card} flex items-center justify-between hover:border-[#f5a623]/50 transition-colors`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] rounded-xl flex items-center justify-center text-white font-black">
                  {c.categorie?.charAt(0) || 'V'}
                </div>
                <div>
                  <p className={`text-sm font-black ${theme.text}`}>{c.categorie}</p>
                  <p className={`text-[10px] font-bold ${theme.sub}`}>Édition {c.titre}</p>
                </div>
              </div>
              
              {/* BOUTON CORRIGÉ AVEC LE 'S' POUR CORRESPONDRE À APP.JSX */}
            
<button 
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    // On s'assure que slug est bien défini
    const targetSlug = c.slug || c.id; 
    navigate(`/votes/${targetSlug}`); 
  }}
  className="relative z-10 bg-[#f5a623]/10 text-[#f5a623] px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-[#f5a623] hover:text-white transition-all"
>
  Voter
</button>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center py-16 rounded-[2rem] border border-dashed ${theme.card}`}>
          <TrendingUp size={40} className="text-slate-300 dark:text-slate-700 mb-4" />
          <p className={`text-sm font-black ${theme.text}`}>Aucun concours actif pour le moment.</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 px-6 py-2 rounded-full bg-[#f5a623]/10 text-[#f5a623] text-[10px] font-black uppercase tracking-widest hover:bg-[#f5a623] hover:text-white transition-all flex items-center gap-2"
          >
            Retour à l'accueil <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}