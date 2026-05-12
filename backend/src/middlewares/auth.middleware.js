import { supabaseAdmin } from '../config/supabase.js';

/**
 * Protège les routes : vérifie le token Supabase et injecte l'utilisateur dans req.user
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Accès non autorisé, token manquant' });
  }

  try {
    // Vérification du token auprès de Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Session invalide ou expirée' });
    }

    // Récupération du profil complet (pour avoir le rôle et le statut isActive)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.isActive) {
      return res.status(403).json({ success: false, message: 'Compte désactivé ou banni' });
    }

    // On attache le profil complet à la requête
    req.user = profile;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Erreur d\'authentification' });
  }
};