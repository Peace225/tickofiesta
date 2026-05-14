import { createClient } from '@supabase/supabase-js'

// 1. Lecture des variables Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// 2. Validation
if (!supabaseUrl ||!supabaseUrl.startsWith('https://')) {
  throw new Error(
    `[Supabase] VITE_SUPABASE_URL invalide ("${supabaseUrl}"). Vérifie ton.env en local ou les Environment Variables sur Vercel.`
  )
}

if (!supabaseAnonKey || supabaseAnonKey.length < 100) {
  throw new Error(
    '[Supabase] VITE_SUPABASE_ANON_KEY manquante ou incorrecte. Vérifie ton.env ou Vercel.'
  )
}

// 3. Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// 4. API backend
export const API_URL = import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV? 'http://localhost:5000/api' : '')