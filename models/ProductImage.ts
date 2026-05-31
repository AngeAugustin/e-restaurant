import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductImageDocument extends Document {
  data: Buffer;
  contentType: string;
  filename: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImageDocument>(
  {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const ProductImage: Model<IProductImageDocument> =
  (mongoose.models.ProductImage as Model<IProductImageDocument> | undefined) ||
  mongoose.model<IProductImageDocument>("ProductImage", ProductImageSchema);

export default ProductImage;
