/**
 * Middleware pour capturer le corps brut (Raw Body)
 * Nécessaire pour la vérification des signatures HMAC de Stripe ou Mobile Money
 */
export const rawBodySaver = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};