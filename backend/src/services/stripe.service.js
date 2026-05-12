import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Créer une session de paiement Stripe Checkout
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
              description: `Événement : ${ticket.event_title || 'Événement TickoFiesta'}`,
            },
            unit_amount: Math.round(ticket.prix), 
          },
          quantity: quantite,
        },
      ],
      metadata: {
        transactionRef: ticket.transactionRef || '', 
        userId: user.id,
        ticketId: ticket.id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  } catch (error) {
    console.error('Stripe Service Error:', error.message);
    throw new Error('Erreur lors de la création de la session Stripe');
  }
};

/**
 * Vérifier la signature du webhook Stripe
 * C'est cette fonction qui manquait à l'export !
 */
export const constructWebhookEvent = (payload, signature) => {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new Error(`Signature Webhook invalide : ${err.message}`);
  }
};