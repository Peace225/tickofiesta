/**
 * Gestionnaire d'erreurs centralisé
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log de l'erreur pour le développement
  if (process.env.NODE_ENV === 'development') {
    console.error('Erreur Backend:', err);
  }

  // Erreurs spécifiques Supabase/PostgreSQL (ex: violation de contrainte)
  if (err.code === '23505') {
    error.message = 'Cette ressource existe déjà (Doublon)';
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};