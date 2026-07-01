import mongoose, { Schema, Document } from 'mongoose';

export interface IOccurrence extends Document {
  type: 'manual' | 'automatic';
  product: mongoose.Types.ObjectId;
  quantity: number;
  description: string;
  team: string;
  personName: string;
  loan?: mongoose.Types.ObjectId;
  status: 'pending' | 'acknowledged';
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OccurrenceSchema = new Schema<IOccurrence>(
  {
    type: { type: String, enum: ['manual', 'automatic'], required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true },
    team: { type: String, required: true, trim: true },
    personName: { type: String, required: true, trim: true },
    loan: { type: Schema.Types.ObjectId, ref: 'Loan' },
    status: { type: String, enum: ['pending', 'acknowledged'], default: 'pending' },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

OccurrenceSchema.index({ status: 1 });
OccurrenceSchema.index({ type: 1 });
OccurrenceSchema.index({ team: 1 });
OccurrenceSchema.index({ createdAt: -1 });

export const Occurrence = mongoose.model<IOccurrence>('Occurrence', OccurrenceSchema);
