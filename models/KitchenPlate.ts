import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKitchenPlateDocument extends Document {
  number: string;
  createdAt: Date;
  updatedAt: Date;
}

const KitchenPlateSchema = new Schema<IKitchenPlateDocument>(
  {
    number: {
      type: String,
      required: [true, "Le numéro de plaquette est requis"],
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const KitchenPlate: Model<IKitchenPlateDocument> =
  (mongoose.models.KitchenPlate as Model<IKitchenPlateDocument> | undefined) ||
  mongoose.model<IKitchenPlateDocument>("KitchenPlate", KitchenPlateSchema);

export default KitchenPlate;
