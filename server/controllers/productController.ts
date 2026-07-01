import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { Product } from '../models/Product';
import { createLog } from '../middleware/logger';
import { createNotification } from '../services/notificationService';
import { emitEvent } from '../socket/handler';

const generateInternalCode = (): string => {
  return 'PRD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, category, status, location, page = '1', limit = '50' } = req.query;
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { internalCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (location) query.storageLocation = { $regex: location, $options: 'i' };

    if (status) {
      if (status === 'out_of_stock') query.quantity = 0;
      else if (status === 'low_stock') {
        query.$expr = { $lte: ['$quantity', '$minimumQuantity'] };
        query.quantity = { $gt: 0 };
      } else if (status === 'in_stock') {
        query.$expr = { $gt: ['$quantity', '$minimumQuantity'] };
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({ products, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name');
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, description, storageLocation, quantity, minimumQuantity, variations } = req.body;

    const internalCode = generateInternalCode();
    const totalQuantity = variations?.reduce((sum: number, v: { quantity: number }) => sum + (v.quantity || 0), 0) || (quantity || 0);

    const product = await Product.create({
      name,
      internalCode,
      category,
      description,
      storageLocation,
      quantity: totalQuantity,
      minimumQuantity: minimumQuantity || 1,
      variations: variations || [],
      createdBy: req.user?._id,
    });

    await createLog(req.user?._id.toString(), 'CREATE_PRODUCT', 'Product', `Created product ${product.name}`, req.ip, req.headers['user-agent']);
    await createNotification('new_product', `Novo produto cadastrado: ${product.name}`, undefined, '/products');
    emitEvent('stock:updated', { productId: product._id, quantity: product.quantity });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error creating product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, category, description, storageLocation, quantity, minimumQuantity, variations } = req.body;

    const updateData: Record<string, unknown> = {
      name, category, description, storageLocation, minimumQuantity,
    };

    if (variations) {
      updateData.variations = variations;
      updateData.quantity = variations.reduce((sum: number, v: { quantity: number }) => sum + (v.quantity || 0), 0);
    } else if (quantity !== undefined) {
      updateData.quantity = quantity;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await createLog(req.user?._id.toString(), 'UPDATE_PRODUCT', 'Product', `Updated product ${product.name}`, req.ip, req.headers['user-agent']);
    emitEvent('stock:updated', { productId: product._id, quantity: product.quantity, name: product.name });

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await createLog(req.user?._id.toString(), 'DELETE_PRODUCT', 'Product', `Deleted product ${product.name}`, req.ip, req.headers['user-agent']);
    emitEvent('stock:updated', { productId: product._id, deleted: true });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
};

export const getLowStockProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$minimumQuantity'] },
      quantity: { $gt: 0 },
    }).sort({ quantity: 1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching low stock products' });
  }
};

export const getOutOfStockProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ quantity: 0 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching out of stock products' });
  }
};

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching categories' });
  }
};
