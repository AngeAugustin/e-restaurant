import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAccountingPeriodDocument extends Document {
  openingBalance: number;
  openedAt: Date;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountingPeriodSchema = new Schema<IAccountingPeriodDocument>(
  {
    openingBalance: {
      type: Number,
      required: [true, "Le solde d’ouverture est requis"],
      min: [0, "Le solde d’ouverture ne peut pas être négatif"],
    },
    openedAt: {
      type: Date,
      required: [true, "La date d’ouverture est requise"],
      index: true,
    },
    note: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

AccountingPeriodSchema.index({ openedAt: -1 });

const AccountingPeriod: Model<IAccountingPeriodDocument> =
  (mongoose.models.AccountingPeriod as Model<IAccountingPeriodDocument> | undefined) ||
  mongoose.model<IAccountingPeriodDocument>("AccountingPeriod", AccountingPeriodSchema);

export default AccountingPeriod;
