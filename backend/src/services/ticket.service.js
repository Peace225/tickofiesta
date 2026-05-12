import crypto from 'crypto';
import QRCode from 'qrcode';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Génère une référence de transaction unique
 */
export const generateTransactionRef = () => {
  return 'TKF-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + Date.now().toString().slice(-4);
};

/**
 * Génère le hash unique du QR Code pour la validation
 */
const generateQRHash = (userId, ticketId, transactionRef) => {
  return crypto
    .createHash('sha256')
    .update(`${userId}-${ticketId}-${transactionRef}-${Math.random()}`)
    .digest('hex');
};

/**
 * Génère l'image QR Code en base64
 */
const generateQRImage = async (data) => {
  return await QRCode.toDataURL(JSON.stringify(data), {
    errorCorrectionLevel: 'H',
    width: 350,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
};

/**
 * Logique principale : Création des billets et calcul des commissions
 * Un billet individuel est généré pour chaque unité pour permettre le scan unique.
 */
export const processPurchase = async (userId, ticketId, quantite = 1) => {
  // 1. Récupérer les infos du ticket et de l'événement via une jointure PostgreSQL
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('tickets')
    .select('*, events(id, titre, is_first_event, organisateur_id)')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) throw new Error('Ticket introuvable');

  const placesRestantes = ticket.quantite_disponible - ticket.quantite_vendue;
  if (placesRestantes < quantite) {
    throw new Error(`Places insuffisantes. Restant : ${placesRestantes}`);
  }

  // 2. Calcul de la commission dynamique
  let commissionRate = 0;
  const event = ticket.events;

  if (event && !event.is_first_event) {
    // Calcul du cumul des revenus pour cet événement via Supabase
    const { data: sumData } = await supabaseAdmin
      .from('purchases')
      .select('montant')
      .eq('event_id', event.id)
      .eq('status', 'completed');

    const totalRevenusActuels = sumData?.reduce((acc, curr) => acc + curr.montant, 0) || 0;
    const nouveauTotal = totalRevenusActuels + (ticket.prix * quantite);
    
    // Logique de palier (Exemple : 10% par défaut)
    commissionRate = nouveauTotal > 1000000 ? 8 : 10; 
  }

  const commissionParBillet = Math.round((ticket.prix * commissionRate) / 100);
  const purchasesToInsert = [];

  // 3. Boucle de génération des billets individuels
  for (let i = 0; i < quantite; i++) {
    const transactionRef = generateTransactionRef();
    const qrHash = generateQRHash(userId, ticketId, transactionRef);

    const qrData = {
      ref: transactionRef,
      hash: qrHash,
      event: event.titre,
      type: ticket.type
    };

    const qrImage = await generateQRImage(qrData);

    purchasesToInsert.push({
      user_id: userId,
      ticket_id: ticketId,
      event_id: event.id,
      transaction_ref: transactionRef,
      qr_code_data: qrHash,
      qr_code_image: qrImage,
      montant: ticket.prix,
      status: 'completed',
      commission_rate: commissionRate,
      commission_amount: commissionParBillet,
      confirmed_at: new Date().toISOString()
    });
  }

  // 4. Insertion en masse (Bulk Insert) et mise à jour du quota
  const { data: createdPurchases, error: insertError } = await supabaseAdmin
    .from('purchases')
    .insert(purchasesToInsert)
    .select();

  if (insertError) throw insertError;

  // Mise à jour atomique de la quantité vendue
  await supabaseAdmin
    .from('tickets')
    .update({ quantite_vendue: ticket.quantite_vendue + quantite })
    .eq('id', ticketId);

  return createdPurchases;
};