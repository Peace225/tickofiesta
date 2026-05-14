import { createClient } from '@supabase/supabase-js';

// 1. Lecture des variables Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// 2. Validation unique et claire
if (!supabaseUrl ||!supabaseUrl.startsWith('https://')) {
  throw new Error(
    `[Supabase] VITE_SUPABASE_URL invalide. Valeur reçue: "${supabaseUrl}". Vérifie ton.env à la racine.`
  );
}

if (!supabaseAnonKey || supabaseAnonKey.length < 30) {
  throw new Error(
    '[Supabase] VITE_SUPABASE_ANON_KEY manquante ou trop courte. Vérifie ton.env.'
  );
}

// 3. Client avec les options recommandées
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 4. Bonus : exporte aussi ton API backend si tu en as besoin ailleurs
export const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:5000/api';