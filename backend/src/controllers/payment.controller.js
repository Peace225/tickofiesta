import { supabaseAdmin } from '../config/supabase.js';
import { createCheckoutSession, constructWebhookEvent } from '../services/stripe.service.js';

/**
 * @desc    Initialiser un paiement (Stripe ou Mobile Money)
 * @route   POST /api/payments/checkout
 */
export const createPaymentSession = async (req, res, next) => {
  try {
    const { ticket_id, quantite = 1, method = 'stripe' } = req.body;
    const userId = req.user.id; 

    if (!ticket_id) {
      return res.status(400).json({ success: false, message: 'ID du ticket requis' });
    }

    // 1. Vérifier la disponibilité
    const { data: ticket, error: tError } = await supabaseAdmin
      .from('tickets')
      .select('*, event:event_id(titre, date, lieu)')
      .eq('id', ticket_id)
      .single();

    if (tError || !ticket) return res.status(404).json({ success: false, message: 'Ticket introuvable' });

    const restant = ticket.quantite_disponible - ticket.quantite_vendue;
    if (restant < quantite) {
      return res.status(400).json({ success: false, message: `Places insuffisantes (${restant} restantes)` });
    }

    // 2. Référence unique
    const transactionRef = `TKF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. Enregistrement "Pending"
    const { error: pError } = await supabaseAdmin.from('purchases').insert([{
      id: transactionRef,
      user_id: userId,
      event_id: ticket.event_id,
      ticket_id: ticket.id,
      montant: ticket.prix * quantite,
      quantite: quantite,
      status: 'pending',
      payment_method: method
    }]);

    if (pError) throw pError;

    // 4. Session de paiement
    let paymentUrl = '';
    if (method === 'stripe') {
      const session = await createCheckoutSession({
        ticket: { ...ticket, event_title: ticket.event.titre },
        quantite,
        user: req.user,
        successUrl: `${process.env.CLIENT_URL}/payment-success?ref=${transactionRef}`,
        cancelUrl: `${process.env.CLIENT_URL}/payment-failed`
      });
      paymentUrl = session.url;
    } else {
      paymentUrl = `https://pay.provider.com/checkout/${transactionRef}`; 
    }

    res.status(200).json({ success: true, url: paymentUrl, transactionRef });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Webhook Stripe - Confirmation finale
 */
export const stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const transactionRef = session.metadata.transactionRef;
    await finalizePurchase(transactionRef);
  }

  res.status(200).json({ received: true });
};

/**
 * @desc    Webhook Mobile Money (Générique)
 */
export const mobileMoneyWebhook = async (req, res) => {
  const { transaction_id, status } = req.body;
  if (status === 'SUCCESS' || status === 'ACCEPTED') {
    await finalizePurchase(transaction_id);
    return res.status(200).send('OK');
  }
  res.status(400).send('Échec');
};

/**
 * @desc    Vérifier le statut d'un achat
 * @route   GET /api/payments/session/:transactionId
 */
export const getSessionStatus = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    
    const { data: purchase, error } = await supabaseAdmin
      .from('purchases')
      .select('*, event:event_id(titre, date, lieu), ticket:ticket_id(type, prix)')
      .eq('id', transactionId)
      .single();

    if (error || !purchase) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' });
    }

    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

/**
 * LOGIQUE INTERNE - Validation et Stock
 */
async function finalizePurchase(transactionId) {
  try {
    const { data: purchase } = await supabaseAdmin
      .from('purchases')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!purchase || purchase.status === 'completed') return;

    await supabaseAdmin.from('purchases').update({
      status: 'completed',
      confirmed_at: new Date().toISOString(),
      qr_code_data: `TICKO-${purchase.id}-${purchase.user_id}`
    }).eq('id', transactionId);

    // Mise à jour du stock (nécessite la fonction SQL rpc vue précédemment)
    await supabaseAdmin.rpc('increment_ticket_sales', { 
      t_id: purchase.ticket_id, 
      qty: purchase.quantite 
    });

  } catch (err) {
    console.error('Erreur finalisation:', err.message);
  }
}