import { supabaseAdmin } from '../src/config/supabase.js';

async function setupStorage() {
  // Créer le bucket pour les affiches d'événements
  const { data, error } = await supabaseAdmin
    .storage
    .createBucket('events-images', { public: true });

  if (error) console.log('Info:', error.message);
  else console.log('Bucket "events-images" créé !');
}

setupStorage();