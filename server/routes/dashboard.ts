import { Router } from 'express';
import {
  getDashboardStats,
  getRecentActivity,
  getChartData,
  getRecentLoans,
  getRecentReturns,
} from '../controllers/dashboardController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);
router.get('/charts', getChartData);
router.get('/recent-loans', getRecentLoans);
router.get('/recent-returns', getRecentReturns);

export default router;
