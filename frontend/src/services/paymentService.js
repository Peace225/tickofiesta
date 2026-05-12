// On récupère l'URL de ton backend depuis le fichier .env (ou on utilise le port 5000 par défaut)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const paymentService = {
  // 1. Demander à ton backend Node.js de préparer un paiement Stripe
  async createPaymentIntent(cartItems, userEmail) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: cartItems,
          email: userEmail
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du paiement côté serveur');
      }

      const data = await response.json();
      return data; // Contient généralement le fameux 'client_secret' de Stripe
      
    } catch (error) {
      console.error("Erreur PaymentService:", error);
      throw error;
    }
  }
};