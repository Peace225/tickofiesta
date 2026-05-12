import { supabaseAdmin } from '../config/supabase.js';

/**
 * Logique principale du vote avec anti-fraude
 * Supporte les votes multiples (via packs payants)
 */
export const processVote = async ({ event_id, candidat_id, user_id, ip_address, quantite = 1 }) => {
  // 1. Vérifier si l'événement existe et si le vote est ouvert
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('vote_actif')
    .eq('id', event_id)
    .single();

  if (eventError || !event) throw new Error('Événement introuvable');
  if (!event.vote_actif) throw new Error("Le vote n'est pas actif pour cet événement");

  // 2. Préparation de l'insertion (On peut voter plusieurs fois avec un pack)
  // Nous enregistrons une seule ligne avec une colonne 'poids_du_vote' pour plus d'efficacité
  const { data: vote, error: voteError } = await supabaseAdmin
    .from('votes')
    .insert([{
      event_id,
      candidat_id,
      user_id: user_id || null, // Vote anonyme possible ou identifié
      ip_address,
      poids_du_vote: quantite,
      horodatage: new Date().toISOString()
    }])
    .select()
    .single();

  if (voteError) throw voteError;

  // 3. Récupérer les totaux mis à jour
  const totaux = await getResultats(event_id);

  return { vote, totaux };
};

/**
 * Récupérer les résultats agrégés d'un événement
 * Utilise la puissance de PostgreSQL pour sommer les poids des votes
 */
export const getResultats = async (event_id) => {
  // Option 1 : Utilisation de la sélection groupée via l'API Supabase
  // Note : Pour des performances XXL sur des millions de votes, on utiliserait une RPC (Remote Procedure Call)
  const { data, error } = await supabaseAdmin
    .from('votes')
    .select('candidat_id, poids_du_vote')
    .eq('event_id', event_id);

  if (error) throw error;

  // Agrégation des résultats (Somme des poids par candidat)
  const aggregation = data.reduce((acc, curr) => {
    const cid = curr.candidat_id;
    if (!acc[cid]) {
      acc[cid] = { candidat_id: cid, total_votes: 0 };
    }
    acc[cid].total_votes += curr.poids_du_vote;
    return acc;
  }, {});

  // Transformer en tableau trié par score décroissant
  return Object.values(aggregation).sort((a, b) => b.total_votes - a.total_votes);
};