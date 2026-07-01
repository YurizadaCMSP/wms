import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
  product: mongoose.Types.ObjectId;
  variation?: string;
  team: string;
  personName: string;
  quantity: number;
  observation?: string;
  status: 'active' | 'returned' | 'partial';
  returnedQuantity: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variation: { type: String, trim: true },
    team: { type: String, required: true, trim: true },
    personName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    observation: { type: String, trim: true },
    status: { type: String, enum: ['active', 'returned', 'partial'], default: 'active' },
    returnedQuantity: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

LoanSchema.index({ status: 1 });
LoanSchema.index({ team: 1 });
LoanSchema.index({ createdAt: -1 });
LoanSchema.index({ product: 1 });

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);
