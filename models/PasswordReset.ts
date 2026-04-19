import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPasswordResetDocument extends Document {
  email: string;
  otpHash: string | null;
  otpExpiresAt: Date | null;
  otpAttempts: number;
  resetTokenHash: string | null;
  resetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordResetDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    resetTokenHash: { type: String, default: null },
    resetExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const PasswordReset: Model<IPasswordResetDocument> =
  mongoose.models.PasswordReset ||
  mongoose.model<IPasswordResetDocument>("PasswordReset", PasswordResetSchema);

export default PasswordReset;
