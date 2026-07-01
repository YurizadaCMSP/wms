import mongoose, { Schema, Document } from 'mongoose';

export interface IVariation {
  name: string;
  quantity: number;
}

export interface IProduct extends Document {
  name: string;
  internalCode: string;
  category: string;
  description?: string;
  storageLocation?: string;
  quantity: number;
  minimumQuantity: number;
  variations: IVariation[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VariationSchema = new Schema<IVariation>({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0, min: 0 },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    internalCode: { type: String, required: true, unique: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    storageLocation: { type: String, trim: true },
    quantity: { type: Number, default: 0, min: 0 },
    minimumQuantity: { type: Number, default: 1, min: 0 },
    variations: [VariationSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ProductSchema.index({ internalCode: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 'text', internalCode: 'text', category: 'text' });
ProductSchema.index({ createdAt: -1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
