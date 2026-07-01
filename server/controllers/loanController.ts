import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Loan } from '../models/Loan';
import { Product } from '../models/Product';
import { Occurrence } from '../models/Occurrence';
import { createLog } from '../middleware/logger';
import { createNotification } from '../services/notificationService';
import { emitEvent } from '../socket/handler';

export const getLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, team, person, material, date, page = '1', limit = '50' } = req.query;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (team) query.team = { $regex: team, $options: 'i' };
    if (person) query.personName = { $regex: person, $options: 'i' };
    if (date) {
      const startOfDay = new Date(date as string);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query.createdAt = { $gte: startOfDay, $lt: endOfDay };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [loans, total] = await Promise.all([
      Loan.find(query)
        .populate('product', 'name internalCode category storageLocation')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Loan.countDocuments(query),
    ]);

    if (material) {
      const filteredLoans = loans.filter((l: { product: { name: string } }) =>
        l.product?.name?.toLowerCase().includes((material as string).toLowerCase())
      );
      res.json({ loans: filteredLoans, total: filteredLoans.length, page: pageNum, pages: 1 });
      return;
    }

    res.json({ loans, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching loans' });
  }
};

export const getActiveLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: { $in: ['active', 'partial'] } })
      .populate('product', 'name internalCode category storageLocation variations')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching active loans' });
  }
};

export const createLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, variation, team, personName, quantity, observation } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    let availableQuantity = product.quantity;

    if (variation && product.variations?.length > 0) {
      const varItem = product.variations.find((v: { name: string }) => v.name === variation);
      if (!varItem) {
        res.status(400).json({ error: 'Variation not found' });
        return;
      }
      availableQuantity = varItem.quantity;
    }

    if (quantity > availableQuantity) {
      res.status(400).json({ error: `Insufficient stock. Available: ${availableQuantity}` });
      return;
    }

    const loan = await Loan.create({
      product: productId,
      variation,
      team,
      personName,
      quantity,
      observation,
      status: 'active',
      createdBy: req.user?._id,
    });

    // Update stock
    if (variation && product.variations?.length > 0) {
      const varIndex = product.variations.findIndex((v: { name: string }) => v.name === variation);
      if (varIndex >= 0) {
        product.variations[varIndex].quantity -= quantity;
        product.quantity = product.variations.reduce((sum: number, v: { quantity: number }) => sum + v.quantity, 0);
      }
    } else {
      product.quantity -= quantity;
    }
    await product.save();

    const populatedLoan = await Loan.findById(loan._id)
      .populate('product', 'name internalCode')
      .populate('createdBy', 'name');

    await createLog(req.user?._id.toString(), 'CREATE_LOAN', 'Loan', `Loaned ${quantity}x ${product.name} to ${personName} (${team})`, req.ip, req.headers['user-agent']);
    await createNotification('new_loan', `Novo empréstimo: ${quantity}x ${product.name} - ${personName}`, undefined, '/loans');
    emitEvent('loan:created', populatedLoan);
    emitEvent('stock:updated', { productId: product._id, quantity: product.quantity, name: product.name });

    res.status(201).json(populatedLoan);
  } catch (error) {
    res.status(500).json({ error: 'Error creating loan' });
  }
};

export const getLoanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('product', 'name internalCode category storageLocation variations quantity minimumQuantity')
      .populate('createdBy', 'name');

    if (!loan) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }
    res.json(loan);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching loan' });
  }
};
