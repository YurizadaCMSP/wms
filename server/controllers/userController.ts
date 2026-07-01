import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { createLog } from '../middleware/logger';
import { sendNewAccountEmail, sendNewPasswordEmail } from '../services/emailService';
import { createNotification } from '../services/notificationService';
import { emitEvent } from '../socket/handler';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;
    const query: Record<string, unknown> = { isActive: true };

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, role, team } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const password = crypto.randomBytes(6).toString('hex');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      team,
      createdBy: req.user?._id,
    });

    await sendNewAccountEmail(user.email, user.name, user.email, password);
    await createLog(req.user?._id.toString(), 'CREATE_USER', 'User', `Created user ${user.email} with role ${role}`, req.ip, req.headers['user-agent']);
    await createNotification('new_user', `Novo usuário cadastrado: ${user.name}`, undefined, '/settings');
    emitEvent('user:created', { _id: user._id, name: user.name, role: user.role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, role, team, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email: email?.toLowerCase(), role, team, isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await createLog(req.user?._id.toString(), 'UPDATE_USER', 'User', `Updated user ${user.email}`, req.ip, req.headers['user-agent']);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await createLog(req.user?._id.toString(), 'DELETE_USER', 'User', `Deactivated user ${user.email}`, req.ip, req.headers['user-agent']);
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deactivating user' });
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const newPassword = crypto.randomBytes(6).toString('hex');
    user.password = newPassword;
    await user.save();

    await sendNewPasswordEmail(user.email, user.name, newPassword);
    await createLog(req.user?._id.toString(), 'RESET_PASSWORD', 'User', `Reset password for ${user.email}`, req.ip, req.headers['user-agent']);

    res.json({ message: 'New password sent to user email' });
  } catch (error) {
    res.status(500).json({ error: 'Error resetting password' });
  }
};
