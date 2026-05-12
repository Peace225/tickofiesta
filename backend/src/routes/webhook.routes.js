import express from 'express';
import { stripeWebhook, mobileMoneyWebhook } from '../controllers/payment.controller.js';

const router = express.Router();

// Note : app.use('/api/webhooks', ...) dans app.js utilise express.raw()
router.post('/stripe', stripeWebhook);
router.post('/mobile-money', mobileMoneyWebhook);

export default router;