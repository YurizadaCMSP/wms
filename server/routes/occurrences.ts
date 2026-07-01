import { Router } from 'express';
import { getOccurrences, createOccurrence, acknowledgeOccurrence } from '../controllers/occurrenceController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getOccurrences);
router.post('/', createOccurrence);
router.put('/:id/acknowledge', requireRole('admin', 'coordinator'), acknowledgeOccurrence);

export default router;
