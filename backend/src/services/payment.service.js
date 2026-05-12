import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialisation de l'instance Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Créer une session de paiement Stripe Checkout
 * Adapté pour TickoFiesta (XOF Zero-Decimal)
 */
export const createCheckoutSession = async ({ ticket, quantite, user, successUrl, cancelUrl }) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'xof', 
            product_data: {
              name: `Billet ${ticket.type}`,
              description: `Événement : ${ticket.event_title || 'TickoFiesta Event'}`,
            },
            // XOF est zero-decimal : 5000 = 5000 FCFA (pas de centimes)
            unit_amount: Math.round(ticket.prix), 
          },
          quantity: quantite,
        },
      ],
      // Les métadonnées sont cruciales pour ton Webhook
      metadata: {
        ticket_id: ticket.id,   // ID Supabase (UUID)
        user_id: user.id,       // ID Supabase (UUID)
        quantite: quantite.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  } catch (error) {
    console.error('Stripe Session Error:', error.message);
    throw new Error('Impossible d’initialiser le paiement Stripe');
  }
};

/**
 * Vérifier la signature du webhook Stripe
 * Sécurise ton backend contre les fausses notifications de paiement
 */
export const constructWebhookEvent = (payload, signature) => {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new Error(`Webhook Signature Error: ${err.message}`);
  }
};