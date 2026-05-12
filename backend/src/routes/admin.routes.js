import express from 'express';
import { 
  getStats, getUsers, toggleUser, verifyUser, 
  getAdminEvents, getRevenus, getCommissions 
} from '../controllers/admin.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

// Protection globale : Seul un Admin peut passer ici
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUser);
router.put('/users/:id/verify', verifyUser);
router.get('/events', getAdminEvents);
router.get('/revenus', getRevenus);
router.get('/commissions', getCommissions);

export default router;