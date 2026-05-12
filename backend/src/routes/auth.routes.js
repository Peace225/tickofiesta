import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
// Si tu conserves tes validateurs, assure-toi qu'ils sont en .js
// import { validate, registerSchema, loginSchema } from '../utils/validators.js';

const router = express.Router();

// --- ROUTES D'AUTHENTIFICATION ---

// Inscription et Connexion (avec validation si activée)
router.post('/register', register); 
router.post('/login', login);

// Profil de l'utilisateur connecté
router.get('/me', protect, getMe);

// --- ROUTES PUBLIQUES (ORGANISATEURS) ---

/**
 * @desc    Liste publique des organisateurs certifiés
 * @route   GET /api/auth/organisateurs
 */
router.get('/organisateurs', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    // Requête Supabase sur la table 'profiles'
    const { data: users, count, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nom, email, image, bio, is_verified, created_at', { count: 'exact' })
      .eq('role', 'organisateur')
      .eq('isActive', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({ 
      success: true, 
      total: count, 
      page: Number(page),
      data: users 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Profil public d'un organisateur par son ID
 * @route   GET /api/auth/organisateurs/:id
 */
router.get('/organisateurs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nom, email, image, bio, is_verified, created_at')
      .eq('id', id)
      .eq('role', 'organisateur')
      .eq('isActive', true)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Organisateur introuvable' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;