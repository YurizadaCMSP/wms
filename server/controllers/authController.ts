import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest, generateToken } from '../middleware/auth';
import { User } from '../models/User';
import { createLog } from '../middleware/logger';
import { sendPasswordResetEmail, sendNewPasswordEmail } from '../services/emailService';
import { createNotification } from '../services/notificationService';
import { emitEvent } from '../socket/handler';

const passwordResets = new Map<string, { userId: string; expires: number }>();

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString());

    await createLog(user._id.toString(), 'LOGIN', 'Auth', `User ${user.email} logged in`, req.ip, req.headers['user-agent']);
    await createNotification('login', `${user.name} entrou no sistema`, undefined, '/dashboard');
    emitEvent('user:activity', { type: 'login', user: user.name });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login error' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await createLog(req.user._id.toString(), 'LOGOUT', 'Auth', `User ${req.user.email} logged out`, req.ip, req.headers['user-agent']);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      team: req.user.team,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.json({ message: 'If the email exists, a reset link will be sent' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    passwordResets.set(resetToken, { userId: user._id.toString(), expires: Date.now() + 3600000 });

    await sendPasswordResetEmail(user.email, user.name, resetToken);
    res.json({ message: 'If the email exists, a reset link will be sent' });
  } catch (error) {
    res.status(500).json({ error: 'Error sending reset email' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const resetData = passwordResets.get(token);

    if (!resetData || resetData.expires < Date.now()) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const user = await User.findById(resetData.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.password = newPassword;
    await user.save();
    passwordResets.delete(token);

    await createLog(user._id.toString(), 'PASSWORD_RESET', 'Auth', `Password reset for ${user.email}`, req.ip, req.headers['user-agent']);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error resetting password' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    req.user.password = newPassword;
    await req.user.save();

    await createLog(req.user._id.toString(), 'PASSWORD_CHANGE', 'Auth', `Password changed for ${req.user.email}`, req.ip, req.headers['user-agent']);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error changing password' });
  }
};
