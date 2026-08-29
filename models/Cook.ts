import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type StaffPaymentMode = "CASH" | "MOBILE_MONEY";

export interface ICookDocument extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  diploma?: string;
  photo?: string;
  paymentMode: StaffPaymentMode;
  jobTitle?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CookSchema = new Schema<ICookDocument>(
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
      required: [true, "Le numéro de téléphone est requis"],
      trim: true,
    },
    diploma: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMode: {
      type: String,
      enum: ["CASH", "MOBILE_MONEY"],
      required: [true, "Le mode de paiement est requis"],
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

const Cook: Model<ICookDocument> =
  (mongoose.models.Cook as Model<ICookDocument> | undefined) ||
  mongoose.model<ICookDocument>("Cook", CookSchema);

export default Cook;
