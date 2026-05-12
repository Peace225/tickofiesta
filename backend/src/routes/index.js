const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const ticketRoutes = require('./ticket.routes');
const purchaseRoutes = require('./purchase.routes');
const voteRoutes = require('./vote.routes');
const paymentRoutes = require('./payment.routes');
const adminRoutes = require('./admin.routes');
const promoRoutes = require('./promo.routes');
const analyticsRoutes = require('./analytics.routes');

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/votes', voteRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/promo', promoRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
