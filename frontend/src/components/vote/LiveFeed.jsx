import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from "../../config/supabaseClient";
import { Zap } from 'lucide-react';

export default function LiveFeed({ voteId }) {
  const { dark } = useSelector((s) => s.theme);
  const [feed, setFeed] = useState([]);

  // Thème dynamique
  const theme = {
    card: dark ? 'bg-[#161621] border-white/5' : 'bg-white border-slate-100',
    text: dark ? 'text-white' : 'text-slate-800',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    accent: dark ? 'border-[#00d4aa]' : 'border-blue-500',
    highlight: dark ? 'text-[#00d4aa]' : 'text-blue-600'
  };

  useEffect(() => {
    // 1. Récupération initiale - AJOUT de la colonne voter_name
    const fetchRecent = async () => {
      let query = supabase
        .from('vote_logs')
        .select(`id, created_at, voter_name, profiles(full_name), candidats(nom)`) // 👈 Ajout ici
        .order('created_at', { ascending: false })
        .limit(5);

      if (voteId) {
          // Si besoin de filtrer plus tard
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Erreur LiveFeed:", error.message);
      } else if (data) {
        setFeed(data);
      }
    };

    fetchRecent();

    // 2. Écoute temps réel
    const channel = supabase.channel('realtime:vote_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_logs' }, async (payload) => {
        
        // CORRECTION : On récupère la ligne avec la nouvelle colonne voter_name
        const { data: newRow } = await supabase
          .from('vote_logs')
          .select(`id, created_at, voter_name, profiles(full_name), candidats(nom)`) // 👈 Ajout ici
          .eq('id', payload.new.id)
          .single();

        if (newRow) {
          setFeed(prev => [newRow, ...prev].slice(0, 5));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [voteId]);

  // Si aucun message n'existe
  if (feed.length === 0) return null; 

  return (
    <div className={`rounded-3xl p-5 shadow-sm border overflow-hidden ${theme.card}`}>
      
      {/* En-tête avec indicateur Live */}
      <h3 className={`text-[10px] font-black uppercase tracking-widest mb-5 flex items-center gap-2 ${theme.sub}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        Flux en direct
      </h3>
      
      {/* Liste des votes */}
      <div className="space-y-4">
        {feed.map((log) => {
          // 👇 LOGIQUE D'AFFICHAGE DU NOM
          // 1. Cherche le compte connecté (profiles)
          // 2. SINON cherche le nom tapé par l'invité au moment du paiement (voter_name)
          // 3. SINON affiche "Un supporter"
          const displayName = log.profiles?.full_name || log.voter_name || 'Un supporter';

          return (
            <div 
              key={log.id} 
              className={`animate-in slide-in-from-right fade-in duration-500 border-l-2 ${theme.accent} pl-3 py-1`}
            >
              <p className={`text-xs font-black ${theme.text} mb-1`}>
                {displayName} 
                <span className="font-medium text-[10px] uppercase tracking-widest text-slate-500 mx-1">
                  a voté pour
                </span> 
                <span className={theme.highlight}>
                  {log.candidats?.nom}
                </span>
              </p>
              <p className={`text-[10px] flex items-center gap-1 ${theme.sub}`}>
                <Zap size={10} className="text-yellow-500" />
                Il y a un instant
              </p>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}