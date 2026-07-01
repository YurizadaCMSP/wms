import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Occurrence } from '../models/Occurrence';
import { createLog } from '../middleware/logger';
import { createNotification } from '../services/notificationService';
import { emitEvent } from '../socket/handler';

export const getOccurrences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type, team, date, page = '1', limit = '50' } = req.query;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (team) query.team = { $regex: team, $options: 'i' };
    if (date) {
      const startOfDay = new Date(date as string);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query.createdAt = { $gte: startOfDay, $lt: endOfDay };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [occurrences, total] = await Promise.all([
      Occurrence.find(query)
        .populate('product', 'name internalCode')
        .populate('acknowledgedBy', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Occurrence.countDocuments(query),
    ]);

    res.json({ occurrences, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching occurrences' });
  }
};

export const createOccurrence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { product, quantity, description, team, personName } = req.body;

    const occurrence = await Occurrence.create({
      type: 'manual',
      product,
      quantity,
      description,
      team,
      personName,
      status: 'pending',
      createdBy: req.user?._id,
    });

    const populatedOccurrence = await Occurrence.findById(occurrence._id)
      .populate('product', 'name internalCode');

    await createLog(req.user?._id.toString(), 'CREATE_OCCURRENCE', 'Occurrence', `Created occurrence for product ${product}`, req.ip, req.headers['user-agent']);
    await createNotification('new_occurrence', `Nova ocorrência registrada: ${quantity}x material`, undefined, '/occurrences');
    emitEvent('occurrence:created', populatedOccurrence);

    res.status(201).json(populatedOccurrence);
  } catch (error) {
    res.status(500).json({ error: 'Error creating occurrence' });
  }
};

export const acknowledgeOccurrence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const occurrence = await Occurrence.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy: req.user?._id,
        acknowledgedAt: new Date(),
      },
      { new: true }
    ).populate('product', 'name internalCode')
     .populate('acknowledgedBy', 'name');

    if (!occurrence) {
      res.status(404).json({ error: 'Occurrence not found' });
      return;
    }

    await createLog(req.user?._id.toString(), 'ACKNOWLEDGE_OCCURRENCE', 'Occurrence', `Acknowledged occurrence ${req.params.id}`, req.ip, req.headers['user-agent']);
    emitEvent('occurrence:acknowledged', occurrence);

    res.json(occurrence);
  } catch (error) {
    res.status(500).json({ error: 'Error acknowledging occurrence' });
  }
};
