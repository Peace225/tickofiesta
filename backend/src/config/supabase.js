import { createClient } from '@supabase/supabase-js'; // Corrigé ici
import dotenv from 'dotenv';
dotenv.config();

/**
 * Client Supabase avec privilèges Admin
 * Utilisé pour le bypass des RLS (validation de billets, gestion des votes)
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);