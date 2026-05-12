import express from 'express';
import { trackPageView, getAnalyticsStats } from '../controllers/analytics.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Tracking public (accessible à tous les visiteurs)
router.post('/track', trackPageView);

// Statistiques (uniquement Admin)
router.get('/stats', protect, authorize('admin'), getAnalyticsStats);

export default router;