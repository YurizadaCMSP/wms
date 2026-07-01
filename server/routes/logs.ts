import { Router } from 'express';
import { getLogs } from '../controllers/logController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'coordinator'));

router.get('/', getLogs);

export default router;
