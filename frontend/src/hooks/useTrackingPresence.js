// hooks/useTrackingPresence.js
import { useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { useSelector } from 'react-redux';

export function useTrackingPresence() {
  // Récupérer l'utilisateur connecté via votre state global (ex: Redux) si disponible
  const user = useSelector((s) => s.auth?.user); 

  useEffect(() => {
    const startTime = Date.now();
    // Générer un identifiant unique temporaire pour les anonymes
    const anonymousId = 'anon_' + Math.random().toString(36).substring(2, 11);

    const trackingChannel = supabase.channel('online-visitors', {
      config: { presence: { key: user?.id || anonymousId } }
    });

    trackingChannel
      .on('presence', { event: 'sync' }, () => {
        // Optionnel : Log local
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // On envoie les infos du visiteur au canal Presence
          await trackingChannel.track({
            email: user?.email || 'Visiteur Anonyme',
            nom: user?.raw_user_meta_data?.nom || 'Invité',
            isAnonymous: !user,
            joinedAt: new Date().toISOString(),
            currentPath: window.location.pathname
          });
        }
      });

    return () => {
      // Déconnexion propre du canal quand le visiteur quitte ou ferme l'onglet
      supabase.removeChannel(trackingChannel);
    };
  }, [user]);
}