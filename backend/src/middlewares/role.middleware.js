/**
 * Autorise l'accès uniquement à certains rôles (admin, organisateur, etc.)
 * Doit être utilisé APRÈS le middleware protect
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource` 
      });
    }
    next();
  };
};