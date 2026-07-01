import { Router } from 'express';
import { generateReport } from '../controllers/reportController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'coordinator'));

router.get('/:type', generateReport);

export default router;
