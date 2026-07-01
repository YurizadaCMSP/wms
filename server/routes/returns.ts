import { Router } from 'express';
import { getReturns, createReturn } from '../controllers/returnController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getReturns);
router.post('/', createReturn);

export default router;
