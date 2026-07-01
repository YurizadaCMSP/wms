import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Loan } from '../models/Loan';
import { Product } from '../models/Product';
import { ReturnModel } from '../models/Return';
import { Occurrence } from '../models/Occurrence';
import { createLog } from '../middleware/logger';
import { createNotification } from '../services/notificationService';
import { emitEvent } from '../socket/handler';

export const getReturns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [returns, total] = await Promise.all([
      ReturnModel.find()
        .populate({ path: 'loan', populate: { path: 'product', select: 'name internalCode' } })
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      ReturnModel.countDocuments(),
    ]);

    res.json({ returns, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching returns' });
  }
};

export const createReturn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId, quantity, returnedBy, returnTeam, notes } = req.body;

    const loan = await Loan.findById(loanId).populate('product');
    if (!loan) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    if (loan.status === 'returned') {
      res.status(400).json({ error: 'This loan has already been fully returned' });
      return;
    }

    const remainingQuantity = loan.quantity - loan.returnedQuantity;
    if (quantity > remainingQuantity) {
      res.status(400).json({ error: `Cannot return more than ${remainingQuantity}` });
      return;
    }

    const ret = await ReturnModel.create({
      loan: loanId,
      quantity,
      returnedBy,
      returnTeam,
      notes,
      createdBy: req.user?._id,
    });

    // Update loan
    loan.returnedQuantity += quantity;
    if (loan.returnedQuantity >= loan.quantity) {
      loan.status = 'returned';
    } else {
      loan.status = 'partial';
    }
    await loan.save();

    // Update product stock
    const product = await Product.findById(loan.product);
    if (product) {
      if (loan.variation && product.variations?.length > 0) {
        const varIndex = product.variations.findIndex((v: { name: string }) => v.name === loan.variation);
        if (varIndex >= 0) {
          product.variations[varIndex].quantity += quantity;
          product.quantity = product.variations.reduce((sum: number, v: { quantity: number }) => sum + v.quantity, 0);
        }
      } else {
        product.quantity += quantity;
      }
      await product.save();
    }

    // If partial return, create automatic occurrence
    if (loan.returnedQuantity < loan.quantity) {
      const missingQuantity = loan.quantity - loan.returnedQuantity;
      const occurrence = await Occurrence.create({
        type: 'automatic',
        product: loan.product,
        quantity: missingQuantity,
        description: `Quantidade em falta após devolução parcial. Emprestado: ${loan.quantity}, Devolvido: ${loan.returnedQuantity}`,
        team: loan.team,
        personName: loan.personName,
        loan: loan._id,
        status: 'pending',
      });

      await createNotification('new_occurrence', `Ocorrência automática: ${missingQuantity}x ${product?.name || 'Material'} em falta`, undefined, '/occurrences');
      emitEvent('occurrence:created', occurrence);
    }

    const populatedReturn = await ReturnModel.findById(ret._id)
      .populate({ path: 'loan', populate: { path: 'product', select: 'name internalCode' } });

    await createLog(req.user?._id.toString(), 'CREATE_RETURN', 'Return', `Returned ${quantity}x from loan ${loanId}`, req.ip, req.headers['user-agent']);
    await createNotification('new_return', `Devolução registrada: ${quantity}x ${product?.name || 'Material'}`, undefined, '/returns');
    emitEvent('return:created', populatedReturn);
    emitEvent('loan:updated', { loanId: loan._id, status: loan.status, returnedQuantity: loan.returnedQuantity });
    if (product) {
      emitEvent('stock:updated', { productId: product._id, quantity: product.quantity, name: product.name });
    }

    res.status(201).json({
      return: populatedReturn,
      loanStatus: loan.status,
      occurrenceCreated: loan.returnedQuantity < loan.quantity,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error processing return' });
  }
};
