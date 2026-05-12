import { createClient } from '@supabase/supabase-js';

// 1. Récupération des clés depuis le fichier .env (syntaxe spécifique à Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Sécurité : On vérifie que les clés sont bien trouvées
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🛑 Erreur critique : Les variables d'environnement Supabase (VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY) sont introuvables. Vérifie ton fichier frontend/.env");
}

// 3. Initialisation et exportation du client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);