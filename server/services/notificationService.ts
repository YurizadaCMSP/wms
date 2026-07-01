import { Notification } from '../models/Notification';
import { getIO } from '../socket/handler';

export const createNotification = async (
  type: string,
  message: string,
  userId?: string,
  link?: string
): Promise<void> => {
  try {
    const notification = await Notification.create({
      type,
      message,
      user: userId,
      link,
    });
    const io = getIO();
    if (io) {
      io.emit('notification:new', {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        read: notification.read,
        link: notification.link,
        createdAt: notification.createdAt,
      });
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await Notification.findByIdAndUpdate(notificationId, { read: true });
};

export const getUnreadNotifications = async (userId?: string) => {
  const query = userId ? { $or: [{ user: userId }, { user: { $exists: false } }] } : {};
  return Notification.find({ ...query, read: false })
    .sort({ createdAt: -1 })
    .limit(20);
};
