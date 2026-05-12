import { supabaseAdmin } from '../config/supabase.js';

export const handleMobileMoneyWebhook = async (req, res) => {
  // Structure type reçue par les agrégateurs Mobile Money
  const { transaction_id, status } = req.body; 

  if (status === 'ACCEPTED' || status === 'SUCCESS') {
    try {
      // 1. On valide l'achat et on génère les infos du ticket
      const { error } = await supabaseAdmin
        .from('purchases')
        .update({ 
          status: 'completed',
          confirmed_at: new Date(),
          qr_code_data: `VALID-${transaction_id}` 
        })
        .eq('id', transaction_id);

      if (error) throw error;
      
      return res.status(200).send("OK");
    } catch (err) {
      return res.status(500).send("Erreur interne");
    }
  }
  res.status(400).send("Paiement échoué");
};