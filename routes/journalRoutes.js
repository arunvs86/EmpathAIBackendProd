import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import journalController from '../controllers/journalController.js';

const router = express.Router();

router.get('/', authMiddleware, journalController.listJournals);
router.post('/', authMiddleware, journalController.createJournal);
router.get('/:id', authMiddleware, journalController.getJournal);
router.put('/:id', authMiddleware, journalController.updateJournal);
router.delete('/:id', authMiddleware, journalController.deleteJournal);

export default router;
