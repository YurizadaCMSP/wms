import mongoose, { Schema, Document } from 'mongoose';

export interface IReturn extends Document {
  loan: mongoose.Types.ObjectId;
  quantity: number;
  returnedBy: string;
  returnTeam: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReturnSchema = new Schema<IReturn>(
  {
    loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    quantity: { type: Number, required: true, min: 1 },
    returnedBy: { type: String, required: true, trim: true },
    returnTeam: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ReturnSchema.index({ loan: 1 });
ReturnSchema.index({ createdAt: -1 });

export const ReturnModel = mongoose.model<IReturn>('Return', ReturnSchema);
