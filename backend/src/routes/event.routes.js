import express from 'express';
import { 
  createEvent, getEvents, getEventById, 
  updateEvent, deleteEvent, updateEventStatut, getMesEvenements, getOrgStats 
} from '../controllers/event.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/organisateur/mes-evenements', protect, authorize('organisateur', 'admin'), getMesEvenements);
router.get('/organisateur/stats-revenus', protect, authorize('organisateur', 'admin'), getOrgStats);
router.get('/:id', getEventById);

router.post('/', protect, authorize('organisateur', 'admin'), createEvent);
router.put('/:id', protect, authorize('organisateur', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organisateur', 'admin'), deleteEvent);
router.patch('/:id/statut', protect, authorize('admin'), updateEventStatut);

// VÉRIFIE BIEN CETTE LIGNE :
export default router;