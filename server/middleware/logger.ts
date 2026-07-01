import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Log } from '../models/Log';

export const createLog = async (
  userId: string | undefined,
  action: string,
  target?: string,
  details?: string,
  ip?: string,
  userAgent?: string
): Promise<void> => {
  try {
    await Log.create({
      user: userId,
      action,
      target,
      details,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error('Error creating log:', error);
  }
};

export const logAction = async (
  req: AuthRequest,
  action: string,
  target?: string,
  details?: string
): Promise<void> => {
  await createLog(
    req.user?._id?.toString(),
    action,
    target,
    details,
    req.ip,
    req.headers['user-agent']
  );
};
