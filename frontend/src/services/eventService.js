import { supabase } from '../config/supabaseClient';

export const eventService = {
  // 1. Récupérer tous les événements actifs pour la page d'accueil
  async getActiveEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // 2. Récupérer les détails d'un seul événement AVEC ses candidats
  async getEventDetails(eventId) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        candidates (*)
      `)
      .eq('id', eventId)
      .single();

    if (error) throw error;
    return data;
  }
};