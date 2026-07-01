import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Product } from '../models/Product';
import { Loan } from '../models/Loan';
import { Occurrence } from '../models/Occurrence';
import { User } from '../models/User';
import { Log } from '../models/Log';

export const generateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    const dateQuery: Record<string, unknown> = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) (dateQuery.createdAt as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (dateQuery.createdAt as Record<string, Date>).$lte = new Date(endDate as string);
    }

    let data: unknown;

    switch (type) {
      case 'stock':
        data = await Product.find().sort({ category: 1, name: 1 });
        break;
      case 'loans':
        data = await Loan.find(dateQuery)
          .populate('product', 'name internalCode')
          .populate('createdBy', 'name')
          .sort({ createdAt: -1 });
        break;
      case 'occurrences':
        data = await Occurrence.find(dateQuery)
          .populate('product', 'name internalCode')
          .populate('acknowledgedBy', 'name')
          .sort({ createdAt: -1 });
        break;
      case 'critical_stock':
        data = await Product.find({
          $expr: { $lte: ['$quantity', '$minimumQuantity'] },
        }).sort({ quantity: 1 });
        break;
      case 'users':
        data = await User.find({ isActive: true }).select('-password').sort({ role: 1, name: 1 });
        break;
      case 'logs':
        data = await Log.find(dateQuery)
          .populate('user', 'name email')
          .sort({ createdAt: -1 });
        break;
      default:
        res.status(400).json({ error: 'Invalid report type' });
        return;
    }

    if (format === 'json') {
      res.json({ type, data, generatedAt: new Date() });
      return;
    }

    // For CSV/Excel, we'll return JSON and let frontend handle conversion
    // since jspdf and xlsx are frontend libraries
    res.json({ type, data, format, generatedAt: new Date() });
  } catch (error) {
    res.status(500).json({ error: 'Error generating report' });
  }
};
