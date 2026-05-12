import { supabaseAdmin } from '../config/supabase.js';

/**
 * @desc    Historique des achats de l'utilisateur connecté
 * @route   GET /api/purchases/mes-billets
 * @access  Privé (Client)
 */
export const getMesBillets = async (req, res, next) => {
  try {
    // req.user.id provient de ton middleware de protection Supabase
    const { data: purchases, error } = await supabaseAdmin
      .from('purchases')
      .select(`
        *,
        event:event_id (id, titre, date, lieu, image, categorie),
        ticket:ticket_id (id, type, prix)
      `)
      .eq('user_id', req.user.id)
      .eq('status', 'completed') // On n'affiche que les billets payés
      .order('confirmed_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ 
      success: true, 
      total: purchases.length, 
      data: purchases 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer un billet par sa référence (pour affichage/téléchargement)
 * @route   GET /api/purchases/:id
 * @access  Privé (Propriétaire ou Admin)
 */
export const getBilletById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: purchase, error } = await supabaseAdmin
      .from('purchases')
      .select(`
        *,
        event:event_id (titre, date, lieu, image),
        ticket:ticket_id (type, prix)
      `)
      .eq('id', id)
      .single();

    if (error || !purchase) {
      return res.status(404).json({ success: false, message: 'Billet introuvable' });
    }

    // Sécurité : Seul le propriétaire ou un admin peut voir le détail
    if (purchase.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Scanner un QR Code à l'entrée (Logiciel de contrôle)
 * @route   POST /api/purchases/scan
 * @access  Admin / Staff
 */
export const scanTicket = async (req, res, next) => {
  try {
    const { qr_code_data } = req.body;

    if (!qr_code_data) {
      return res.status(400).json({ success: false, message: 'Données du QR code requises' });
    }

    // 1. Recherche du billet (par QR data ou ID de transaction)
    const { data: purchase, error } = await supabaseAdmin
      .from('purchases')
      .select(`
        *,
        event:event_id (titre, date, lieu),
        profile:user_id (nom, email),
        ticket:ticket_id (type)
      `)
      .or(`qr_code_data.eq.${qr_code_data},id.eq.${qr_code_data}`)
      .single();

    if (error || !purchase) {
      return res.status(404).json({ success: false, message: 'Billet invalide ou inexistant' });
    }

    // 2. Vérification du statut de paiement
    if (purchase.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Billet non payé ou annulé' });
    }

    // 3. Vérification si déjà scanné (Timestamp)
    if (purchase.scanned_at) {
      return res.status(400).json({ 
        success: false, 
        message: `ALERTE : Billet déjà utilisé le ${new Date(purchase.scanned_at).toLocaleString('fr-FR')}`,
        data: purchase 
      });
    }

    // 4. Validation de l'entrée : On marque le passage
    const { data: validatedPurchase, error: updateError } = await supabaseAdmin
      .from('purchases')
      .update({ scanned_at: new Date() })
      .eq('id', purchase.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ 
      success: true, 
      message: 'Billet VALIDE. Entrée autorisée.', 
      data: {
        client: purchase.profile.nom,
        ticket_type: purchase.ticket.type,
        event: purchase.event.titre
      }
    });
  } catch (error) {
    next(error);
  }
};