import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  user?: mongoose.Types.ObjectId;
  action: string;
  target?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    target: { type: String, trim: true },
    details: { type: String, trim: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

LogSchema.index({ action: 1 });
LogSchema.index({ createdAt: -1 });
LogSchema.index({ user: 1 });

export const Log = mongoose.model<ILog>('Log', LogSchema);
