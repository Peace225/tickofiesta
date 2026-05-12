import express from 'express';
import { createPaymentSession, getSessionStatus } from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/checkout', protect, createPaymentSession);
router.get('/session/:transactionId', protect, getSessionStatus);

export default router;