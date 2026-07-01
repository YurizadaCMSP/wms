import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Product } from '../models/Product';
import { Loan } from '../models/Loan';
import { Occurrence } from '../models/Occurrence';
import { ReturnModel } from '../models/Return';
import { Log } from '../models/Log';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [
      totalProducts,
      loanedProducts,
      availableProducts,
      totalOccurrences,
      acknowledgedOccurrences,
      pendingOccurrences,
      activeLoans,
      todayReturns,
      lowStockProducts,
      outOfStockProducts,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]).then(r => r[0]?.total || 0),
      Product.countDocuments({ quantity: { $gt: 0 } }),
      Occurrence.countDocuments(),
      Occurrence.countDocuments({ status: 'acknowledged' }),
      Occurrence.countDocuments({ status: 'pending' }),
      Loan.countDocuments({ status: { $in: ['active', 'partial'] } }),
      ReturnModel.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Product.countDocuments({
        $expr: { $lte: ['$quantity', '$minimumQuantity'] },
        quantity: { $gt: 0 },
      }),
      Product.countDocuments({ quantity: 0 }),
    ]);

    res.json({
      totalProducts,
      loanedProducts,
      availableProducts,
      totalOccurrences,
      acknowledgedOccurrences,
      pendingOccurrences,
      activeLoans,
      todayReturns,
      lowStockProducts,
      outOfStockProducts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recentLogs = await Log.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(recentLogs);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching recent activity' });
  }
};

export const getChartData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Stock by category
    const stockByCategory = await Product.aggregate([
      { $group: { _id: '$category', total: { $sum: '$quantity' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Loan status
    const loanStatus = await Loan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Recent loans by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const loansByDay = await Loan.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top loaned products
    const topLoanedProducts = await Loan.aggregate([
      { $match: { status: { $in: ['active', 'partial'] } } },
      { $group: { _id: '$product', totalLoaned: { $sum: '$quantity' } } },
      { $sort: { totalLoaned: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalLoaned: 1,
        },
      },
    ]);

    res.json({
      stockByCategory,
      loanStatus,
      loansByDay,
      topLoanedProducts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chart data' });
  }
};

export const getRecentLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find()
      .populate('product', 'name internalCode')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching recent loans' });
  }
};

export const getRecentReturns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const returns = await ReturnModel.find()
      .populate({ path: 'loan', populate: { path: 'product', select: 'name internalCode' } })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(returns);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching recent returns' });
  }
};
