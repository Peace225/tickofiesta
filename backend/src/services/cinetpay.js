import axios from 'axios';

const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';

/**
 * Initialise un paiement Mobile Money via CinetPay
 */
export const initCinetPayPayment = async (purchaseId, amount, user) => {
  try {
    const payload = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: purchaseId,
      amount: amount,
      currency: 'XOF', // Ou 'CDF' pour la RDC
      description: `Achat de billet TickoFiesta - Ref: ${purchaseId}`,
      customer_name: user.nom,
      customer_surname: user.nom,
      customer_email: user.email,
      return_url: `${process.env.CLIENT_URL}/payment-success`,
      notify_url: `${process.env.BACKEND_URL}/api/webhooks/mobile-money`, // Ton webhook
      channels: 'ALL', // Permet Carte + Mobile Money
      metadata: JSON.stringify({ purchaseId })
    };

    const response = await axios.post(CINETPAY_API_URL, payload);

    if (response.data.code === '201') {
      return response.data.data.payment_url;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('CinetPay Service Error:', error.response?.data || error.message);
    throw new Error('Erreur lors de l’initialisation du paiement Mobile Money');
  }
};