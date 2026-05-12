import { supabaseAdmin } from '../config/supabase.js';

/**
 * @desc    Inscription (Proxy vers Supabase Auth + Création Profil)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { nom, email, mot_de_passe, role = 'client' } = req.body;

    // 1. Création de l'utilisateur dans Supabase Auth
    // On utilise l'admin SDK pour créer l'utilisateur sans exiger de confirmation d'email immédiate si tu le souhaites
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: mot_de_passe,
      email_confirm: true, // Marquer comme confirmé automatiquement
      user_metadata: { nom, role }
    });

    if (authError) {
      return res.status(400).json({ success: false, message: authError.message });
    }

    // 2. Création du profil dans la table publique 'profiles'
    // Note: Normalement géré par un Trigger SQL dans Supabase, mais double sécurité ici
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        { 
          id: authUser.user.id, 
          nom, 
          email, 
          role,
          isActive: true 
        }
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    res.status(201).json({
      success: true,
      message: 'Compte TickoFiesta créé avec succès',
      user: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Connexion (Vérification Statut + Proxy)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, mot_de_passe } = req.body;

    // 1. Authentification via Supabase
    const { data, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: mot_de_passe,
    });

    if (authError) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    // 2. Vérification si le compte est actif dans ta table 'profiles'
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès refusé. Ce compte est désactivé ou banni.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir le profil de l'utilisateur actuel
 * @route   GET /api/auth/me
 * @access  Privé
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user est injecté par ton middleware de protection qui vérifie le token Supabase
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.status(200).json({ 
      success: true, 
      user: profile 
    });
  } catch (error) {
    next(error);
  }
};