import { supabaseAdmin } from '../src/config/supabase.js';

async function seed() {
  console.log('🚀 Début du seeding...');

  // 1. Création d'un organisateur de test
  const { data: org } = await supabaseAdmin
    .from('profiles')
    .insert([{ nom: 'Elite Events', role: 'organisateur', email: 'test@elite.com' }])
    .select()
    .single();

  // 2. Création d'un événement
  const { data: event } = await supabaseAdmin
    .from('events')
    .insert([{ 
      titre: 'Gala de Luxe TickoFiesta', 
      organisateur_id: org.id,
      statut: 'publie' 
    }])
    .select()
    .single();

  console.log('✅ Données injectées avec succès !');
}

seed();