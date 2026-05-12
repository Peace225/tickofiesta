import { supabaseAdmin } from '../config/supabase.js';

/**
 * @desc    Obtenir les statistiques globales (Tableau de bord Admin)
 */
export const getStats = async (req, res, next) => {
  try {
    // 1. Exécution de plusieurs comptages en parallèle pour la performance
    const [usersCount, eventsCount, purchasesData, votePacksData, promoData] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('events').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('purchases').select('montant').eq('status', 'completed'),
      supabaseAdmin.from('vote_packs').select('montant'),
      supabaseAdmin.from('promotions').select('montant').eq('paiement_confirme', true)
    ]);

    // 2. Calcul des sommes (Revenus)
    const revenus_billets = purchasesData.data?.reduce((acc, curr) => acc + curr.montant, 0) || 0;
    const revenus_packs = votePacksData.data?.reduce((acc, curr) => acc + curr.montant, 0) || 0;
    const revenus_pubs = promoData.data?.reduce((acc, curr) => acc + curr.montant, 0) || 0;

    // 3. Récupération des événements par statut pour le graphique
    const { data: eventsList } = await supabaseAdmin.from('events').select('statut');
    const eventsByStatut = eventsList.reduce((acc, e) => {
      const existing = acc.find(item => item._id === e.statut);
      if (existing) existing.count++;
      else acc.push({ _id: e.statut, count: 1 });
      return acc;
    }, []);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersCount.count,
        totalEvents: eventsCount.count,
        totalPurchases: purchasesData.data?.length || 0,
        revenus_total: revenus_billets + revenus_packs,
        revenus_billets,
        revenus_packs,
        revenus_pubs,
        eventsByStatut
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Liste paginée des utilisateurs
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin.from('profiles').select('*', { count: 'exact' });

    if (role) query = query.eq('role', role);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      data: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activer/Désactiver un utilisateur (et bannir de Supabase Auth)
 */
export const toggleUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Vérifier si l'utilisateur existe
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Impossible de toucher à un admin' });

    const newStatus = !user.isActive;

    // 2. Mise à jour dans Supabase Auth (Admin SDK)
    if (!newStatus) {
      // Si on désactive, on ban de l'auth pour 100 ans
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876000h' });
    } else {
      // Si on réactive, on retire le ban
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: 'none' });
    }

    // 3. Mise à jour dans la table profiles
    const { data: updatedUser } = await supabaseAdmin
      .from('profiles')
      .update({ isActive: newStatus })
      .eq('id', id)
      .select()
      .single();

    res.status(200).json({
      success: true,
      message: `Utilisateur ${newStatus ? 'activé' : 'désactivé et banni'}`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Certifier un organisateur
 */
export const verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: user } = await supabaseAdmin.from('profiles').select('role, is_verified').eq('id', id).single();
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    if (user.role !== 'organisateur') return res.status(400).json({ success: false, message: 'Seuls les organisateurs peuvent être certifiés' });

    const { data: updatedUser } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: !user.is_verified })
      .eq('id', id)
      .select()
      .single();

    res.status(200).json({
      success: true,
      message: updatedUser.is_verified ? 'Organisateur certifié' : 'Certification retirée',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer les événements en attente (Validation Admin)
 */
export const getAdminEvents = async (req, res, next) => {
  try {
    const { statut = 'en_attente' } = req.query;

    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*, profile:organisateur_id(nom, email)')
      .eq('statut', statut)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, total: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyse détaillée des revenus par événement
 */
export const getRevenus = async (req, res, next) => {
  try {
    // Jointure complexe entre Purchases et Events
    const { data: purchases, error } = await supabaseAdmin
      .from('purchases')
      .select('montant, quantite, event:event_id(id, titre, date)')
      .eq('status', 'completed');

    if (error) throw error;

    // Regroupement par événement en JS
    const grouped = purchases.reduce((acc, curr) => {
      const eventId = curr.event.id;
      if (!acc[eventId]) {
        acc[eventId] = { event: curr.event, total: 0, billets_vendus: 0 };
      }
      acc[eventId].total += curr.montant;
      acc[eventId].billets_vendus += curr.quantite;
      return acc;
    }, {});

    const result = Object.values(grouped).sort((a, b) => b.total - a.total);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suivi des commissions générées par TickoFiesta
 */
export const getCommissions = async (req, res, next) => {
  try {
    const { data: purchases, error } = await supabaseAdmin
      .from('purchases')
      .select(`
        montant, 
        quantite, 
        commission_amount, 
        commission_rate,
        event:event_id(
          titre, 
          date, 
          profile:organisateur_id(nom, email)
        )
      `)
      .eq('status', 'completed')
      .gt('commission_rate', 0);

    if (error) throw error;

    const totalCommissions = purchases.reduce((acc, curr) => acc + (curr.commission_amount || 0), 0);

    res.status(200).json({
      success: true,
      total: totalCommissions,
      data: purchases
    });
  } catch (error) {
    next(error);
  }
};