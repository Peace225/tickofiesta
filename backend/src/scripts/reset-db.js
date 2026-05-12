import { supabaseAdmin } from '../src/config/supabase.js';

/**
 * Script de réinitialisation de la base de données TickoFiesta
 * ATTENTION : Cette action est irréversible.
 */
async function resetDatabase() {
  console.log('⚠️  PRÉPARATION DE LA RÉINITIALISATION XXL...');

  // L'ordre est CRUCIAL à cause des clés étrangères (Foreign Keys)
  // On supprime du plus dépendant au moins dépendant
  const tables = [
    'page_views',   // Analytics
    'purchases',    // Achats (dépend des tickets et events)
    'tickets',      // Types de tickets (dépend des events)
    'promotions',   // Pubs (dépend des events)
    'events',       // Événements (dépend des profils)
    'profiles'      // Utilisateurs
  ];

  try {
    for (const table of tables) {
      console.log(`🧹 Nettoyage de la table : ${table}...`);
      
      // .delete().neq('id', 0) est une astuce pour supprimer TOUTES les lignes 
      // car chaque ligne a un ID qui n'est pas égal à 0.
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Pour les UUID

      if (error) {
        console.error(`❌ Erreur sur ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} vidée.`);
      }
    }

    console.log('\n---');
    console.log('✨ BASE DE DONNÉES TICKOFIESTA RÉINITIALISÉE AVEC SUCCÈS !');
    console.log('🚀 Tu peux maintenant relancer le script de seed.');
    
  } catch (err) {
    console.error('💥 Erreur fatale lors du reset :', err.message);
  }
}

// Lancement du script
resetDatabase();