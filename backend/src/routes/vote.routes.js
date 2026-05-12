import express from 'express';
import { 
  voter, getResultatsEvent, addCandidat, getCandidats, 
  toggleVote, getVotesActifs, getVotesPasses, acheterPack, getMonSolde 
} from '../controllers/vote.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * 🗳️ ROUTES PUBLIQUES
 * Affichage des scrutins en cours et des résultats
 */
router.get('/actifs', getVotesActifs);
router.get('/passes', getVotesPasses);
router.get('/:event_id/candidats', getCandidats);
router.get('/:event_id/resultats', getResultatsEvent);

/**
 * 👤 ROUTES CLIENT CONNECTÉ
 * Actions nécessitant une authentification (voter, acheter)
 */
router.post('/', protect, voter);
router.post('/packs/acheter', protect, acheterPack);
router.get('/packs/solde/:event_id', protect, getMonSolde);

/**
 * 👑 ROUTES ORGANISATEUR / ADMIN
 * Gestion des candidats et statut des votes
 */
router.post('/candidats', protect, authorize('organisateur', 'admin'), addCandidat);
router.patch('/:event_id/toggle', protect, authorize('organisateur', 'admin'), toggleVote);

// LA LIGNE CRUCIALE :
export default router;