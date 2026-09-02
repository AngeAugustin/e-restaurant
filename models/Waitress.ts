import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWaitressDocument extends Document {
  firstName: string;
  lastName: string;
  phone?: string;
  paymentMode?: "CASH" | "MOBILE_MONEY";
  jobTitle?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WaitressSchema = new Schema<IWaitressDocument>(
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

const MODEL_NAME = "Waitress";

// Recompile le modèle si le schéma a évolué (hot reload Next.js)
if (mongoose.models[MODEL_NAME] && !mongoose.models[MODEL_NAME].schema.path("isActive")) {
  delete mongoose.models[MODEL_NAME];
}

const Waitress: Model<IWaitressDocument> =
  (mongoose.models[MODEL_NAME] as Model<IWaitressDocument> | undefined) ||
  mongoose.model<IWaitressDocument>(MODEL_NAME, WaitressSchema);

export default Waitress;
