import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import {
  getPartners, getActivePartners, createPartner, updatePartner, deletePartner,
  getAds, getActiveAds, createAd, updateAd, deleteAd,
  getPromotionRequests, updatePromotionRequest, createPromotionRequest, getExpiringAds, deletePromotionRequest,
} from '../controllers/promo.controller.js';

const router = express.Router();

/**
 * ─── PUBLIC ──────────────────────────────────────────────────────────────────
 * Routes pour le Footer et la Homepage de TickoFiesta
 */
router.get('/partners/actifs', getActivePartners);
router.get('/ads/actives', getActiveAds);

/**
 * ─── ORGANISATEUR ────────────────────────────────────────────────────────────
 * Gestion des demandes de mise en avant (XXL Style)
 */
router.post('/promotions', protect, authorize('organisateur', 'admin'), createPromotionRequest);
router.post('/ads', protect, authorize('organisateur', 'admin'), createAd);

/**
 * ─── ADMIN ───────────────────────────────────────────────────────────────────
 * Gestion complète du catalogue partenaires et publicités
 */
router.get('/partners', protect, authorize('admin'), getPartners);
router.post('/partners', protect, authorize('admin'), createPartner);
router.put('/partners/:id', protect, authorize('admin'), updatePartner);
router.delete('/partners/:id', protect, authorize('admin'), deletePartner);

router.get('/ads', protect, authorize('admin'), getAds);
router.get('/ads/expiring', protect, authorize('admin'), getExpiringAds);
router.put('/ads/:id', protect, authorize('admin'), updateAd);
router.delete('/ads/:id', protect, authorize('admin'), deleteAd);

router.get('/promotions', protect, authorize('admin'), getPromotionRequests);
router.patch('/promotions/:id', protect, authorize('admin'), updatePromotionRequest);
router.delete('/promotions/:id', protect, authorize('admin'), deletePromotionRequest);

// LA LIGNE CRUCIALE :
export default router;