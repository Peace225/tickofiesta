import { supabaseAdmin } from '../config/supabase.js';

/**
 * @desc    Créer un type de ticket pour un événement
 * @route   POST /api/tickets
 * @access  Privé (Organisateur / Admin)
 */
export const createTicket = async (req, res, next) => {
  try {
    const { event_id, type, prix, quantite_disponible } = req.body;

    // 1. Vérifier l'existence de l'événement et l'identité de l'organisateur
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('organisateur_id')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ success: false, message: 'Événement introuvable' });
    }

    // Sécurité : Seul l'organisateur propriétaire ou un admin peut ajouter des tickets
    if (event.organisateur_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Action non autorisée' });
    }

    // 2. Création du ticket dans Supabase
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert([{ 
        event_id, 
        type, 
        prix, 
        quantite_disponible,
        quantite_vendue: 0 
      }])
      .select()
      .single();

    if (ticketError) throw ticketError;

    res.status(201).json({ success: true, message: 'Catégorie de ticket créée', data: ticket });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier un ticket (Prix, Quota, etc.)
 * @route   PUT /api/tickets/:id
 * @access  Privé (Organisateur / Admin)
 */
export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Récupérer le ticket avec les infos de l'événement pour vérifier le propriétaire
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('*, event:event_id(organisateur_id)')
      .eq('id', id)
      .single();

    if (fetchError || !ticket) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable' });
    }

    // Vérification de propriété
    if (ticket.event.organisateur_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Action non autorisée' });
    }

    // 2. Mise à jour
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ success: true, message: 'Ticket mis à jour', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un ticket
 * @route   DELETE /api/tickets/:id
 * @access  Privé (Organisateur / Admin)
 */
export const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Vérifier si le ticket a déjà des ventes (On ne supprime pas un ticket déjà vendu !)
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('quantite_vendue, event:event_id(organisateur_id)')
      .eq('id', id)
      .single();

    if (fetchError || !ticket) {
      return res.status(404).json({ success: false, message: 'Ticket introuvable' });
    }

    if (ticket.event.organisateur_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Action non autorisée' });
    }

    if (ticket.quantite_vendue > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible de supprimer un ticket ayant déjà des ventes. Désactivez-le plutôt.' 
      });
    }

    // 2. Suppression
    const { error: deleteError } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({ success: true, message: 'Ticket supprimé avec succès' });
  } catch (error) {
    next(error);
  }
};