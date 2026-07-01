import { Router } from 'express';
import { getLoans, getActiveLoans, createLoan, getLoanById } from '../controllers/loanController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getLoans);
router.get('/active', getActiveLoans);
router.get('/:id', getLoanById);
router.post('/', createLoan);

export default router;
