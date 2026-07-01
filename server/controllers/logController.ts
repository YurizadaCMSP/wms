import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Log } from '../models/Log';

export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user, action, startDate, endDate, page = '1', limit = '50' } = req.query;
    const query: Record<string, unknown> = {};

    if (user) query.user = user;
    if (action) query.action = { $regex: action, $options: 'i' };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [logs, total] = await Promise.all([
      Log.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Log.countDocuments(query),
    ]);

    res.json({ logs, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching logs' });
  }
};
