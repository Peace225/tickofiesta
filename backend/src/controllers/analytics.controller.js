import { supabaseAdmin } from '../config/supabase.js';

/**
 * @desc    Enregistrer une page vue (MODE DEBUG)
 * @route   POST /api/analytics/track
 * @access  Public
 */
export const trackPageView = async (req, res) => {
  try {
    const { page, session_id } = req.body;
    
    // 1. On vérifie si les données arrivent bien jusqu'au Backend
    console.log("📍 [DEBUG ANALYTICS] Données reçues :", { page, session_id });

    if (!page || !session_id) {
      return res.status(400).json({ success: false, message: "Page ou session_id manquant" });
    }

    // 2. 🛑 ON DÉSACTIVE SUPABASE TEMPORAIREMENT 🛑
    /*
    const { error } = await supabaseAdmin.from('page_views').insert([{
      page,
      session_id,
      user_id: req.user?.id || null, 
      date: new Date().toISOString()
    }]);

    if (error) throw error;
    */

    // 3. On simule une réussite
    console.log("✅ [DEBUG ANALYTICS] Tracking simulé avec succès !");
    return res.status(201).json({ success: true, message: "Tracking simulé" });

  } catch (error) {
    console.error('❌ [DEBUG ANALYTICS] Erreur:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Stats analytics pour l'admin (Calculs hybrides)
 * @route   GET /api/analytics/stats
 * @access  Privé (Admin uniquement)
 */
export const getAnalyticsStats = async (req, res, next) => {
  try {
    const now = new Date();
    const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const day14 = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [totalViews, todayViews, week7Views, views30Days] = await Promise.all([
      supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }).gte('date', today),
      supabaseAdmin.from('page_views').select('*', { count: 'exact', head: true }).gte('date', day7),
      supabaseAdmin.from('page_views').select('page, session_id, date').gte('date', day30)
    ]);

    const topPagesMap = views30Days.data?.reduce((acc, curr) => {
      acc[curr.page] = (acc[curr.page] || 0) + 1;
      return acc;
    }, {}) || {};

    const topPages = Object.entries(topPagesMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const day14Data = views30Days.data?.filter(v => v.date >= day14) || [];
    
    const uniqueSessions7 = new Set(
        views30Days.data?.filter(v => v.date >= day7).map(v => v.session_id) || []
    ).size;

    const chartMap = day14Data.reduce((acc, curr) => {
      const d = new Date(curr.date);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      if (!acc[key]) acc[key] = { date: key, vues: 0, visiteurs: new Set() };
      acc[key].vues += 1;
      acc[key].visiteurs.add(curr.session_id);
      return acc;
    }, {});

    const chartData = Object.values(chartMap).map(d => ({
      ...d,
      visiteurs: d.visiteurs.size
    }));

    res.status(200).json({
      success: true,
      data: {
        totalViews: totalViews.count || 0,
        todayViews: todayViews.count || 0,
        week7Views: week7Views.count || 0,
        uniqueVisitors7: uniqueSessions7,
        topPages,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};