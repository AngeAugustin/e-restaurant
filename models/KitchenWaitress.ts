import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IKitchenWaitressDocument extends Document {
  firstName: string;
  lastName: string;
  phone?: string;
  paymentMode?: "CASH" | "MOBILE_MONEY";
  jobTitle?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KitchenWaitressSchema = new Schema<IKitchenWaitressDocument>(
  {
    firstName: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    paymentMode: {
      type: String,
      enum: ["CASH", "MOBILE_MONEY"],
    },
    jobTitle: {
      type: Schema.Types.ObjectId,
      ref: "JobTitle",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const MODEL_NAME = "KitchenWaitress";

const KitchenWaitress: Model<IKitchenWaitressDocument> =
  (mongoose.models[MODEL_NAME] as Model<IKitchenWaitressDocument> | undefined) ||
  mongoose.model<IKitchenWaitressDocument>(MODEL_NAME, KitchenWaitressSchema);

export default KitchenWaitress;
