import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from "../../config/supabaseClient";
import { MessageSquare, Zap } from 'lucide-react';

export default function LiveFeed({ voteId }) {
  const { dark } = useSelector((s) => s.theme);
  const [feed, setFeed] = useState([]);

  // Thème dynamique pour correspondre au reste de l'application
  const theme = {
    card: dark ? 'bg-[#161621] border-white/5' : 'bg-white border-slate-100',
    text: dark ? 'text-white' : 'text-slate-800',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    accent: dark ? 'border-[#00d4aa]' : 'border-blue-500',
    highlight: dark ? 'text-[#00d4aa]' : 'text-blue-600'
  };

  useEffect(() => {
    // 1. Récupération initiale
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('vote_logs')
        .select(`id, message, created_at, profiles(nom), candidats(nom)`)
        .eq('is_public', true)
        .not('message', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (data) setFeed(data);
    };

    fetchRecent();

    // 2. Écoute temps réel
    const channel = supabase.channel('realtime:vote_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vote_logs' }, async (payload) => {
        
        if (payload.new.is_public && payload.new.message) {
          // CORRECTION : On doit récupérer les noms liés à ces IDs pour le nouveau message
          const { data: newRow } = await supabase
            .from('vote_logs')
            .select(`id, message, created_at, profiles(nom), candidats(nom)`)
            .eq('id', payload.new.id)
            .single();

          if (newRow) {
            // On l'ajoute en haut et on garde un maximum de 5 messages
            setFeed(prev => [newRow, ...prev].slice(0, 5));
          }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [voteId]);

  // Si aucun message n'existe, on masque élégamment le bloc
  if (feed.length === 0) return null; 

  return (
    <div className={`rounded-3xl p-5 shadow-sm border overflow-hidden ${theme.card}`}>
      
      {/* En-tête avec indicateur Live clignotant */}
      <h3 className={`text-[10px] font-black uppercase tracking-widest mb-5 flex items-center gap-2 ${theme.sub}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        Flux en direct
      </h3>
      
      {/* Liste des messages */}
      <div className="space-y-4">
        {feed.map((log) => (
          <div 
            key={log.id} 
            className={`animate-in slide-in-from-right fade-in duration-500 border-l-2 ${theme.accent} pl-3 py-1`}
          >
            <p className={`text-xs font-black ${theme.text} mb-1`}>
              {log.profiles?.nom || 'Un supporter'} 
              <span className="font-medium text-[10px] uppercase tracking-widest text-slate-500 mx-1">
                pour
              </span> 
              <span className={theme.highlight}>
                {log.candidats?.nom}
              </span>
            </p>
            <p className={`text-[11px] italic flex items-start gap-1.5 ${theme.sub}`}>
              <MessageSquare size={12} className="mt-0.5 opacity-50 shrink-0" />
              "{log.message}"
            </p>
          </div>
        ))}
      </div>
      
    </div>
  );
}