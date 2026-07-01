import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  getCategories,
} from '../controllers/productController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/low-stock', requireRole('admin', 'coordinator'), getLowStockProducts);
router.get('/out-of-stock', requireRole('admin', 'coordinator'), getOutOfStockProducts);
router.get('/:id', getProductById);
router.post('/', requireRole('admin', 'coordinator'), createProduct);
router.put('/:id', requireRole('admin', 'coordinator'), updateProduct);
router.delete('/:id', requireRole('admin', 'coordinator'), deleteProduct);

export default router;
