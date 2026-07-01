import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, resetUserPassword } from '../controllers/userController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole('admin', 'coordinator'), getUsers);
router.get('/:id', requireRole('admin', 'coordinator'), getUserById);
router.post('/', requireRole('admin', 'coordinator'), createUser);
router.put('/:id', requireRole('admin', 'coordinator'), updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);
router.post('/:id/reset-password', requireRole('admin', 'coordinator'), resetUserPassword);

export default router;
