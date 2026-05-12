import express from 'express';
import { createTicket, updateTicket, deleteTicket } from '../controllers/ticket.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('organisateur', 'admin'), createTicket);
router.put('/:id', authorize('organisateur', 'admin'), updateTicket);
router.delete('/:id', authorize('organisateur', 'admin'), deleteTicket);

export default router;