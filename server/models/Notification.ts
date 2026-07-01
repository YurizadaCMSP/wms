import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: string;
  message: string;
  read: boolean;
  user?: mongoose.Types.ObjectId;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    link: { type: String, trim: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ read: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ user: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
