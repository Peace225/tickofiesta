import express from 'express';
import { getMesBillets, getBilletById, scanTicket } from '../controllers/purchase.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/mes-billets', protect, getMesBillets);
router.get('/:id', protect, getBilletById);
router.post('/scan', protect, authorize('admin', 'staff'), scanTicket);

export default router;