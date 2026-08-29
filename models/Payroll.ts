import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PayrollBeneficiaryType = "WAITRESS" | "COOK" | "MANAGER";

export interface IPayrollDocument extends Document {
  beneficiaryType: PayrollBeneficiaryType;
  waitress?: Types.ObjectId;
  cook?: Types.ObjectId;
  user?: Types.ObjectId;
  jobTitle?: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  baseSalary: number;
  bonuses?: { name: string; amount: number }[];
  bonusName?: string;
  bonusAmount: number;
  amount: number;
  paidAt: Date;
  comment?: string;
  attachmentUrl?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new Schema<IPayrollDocument>(
  {
    beneficiaryType: {
      type: String,
      enum: ["WAITRESS", "COOK", "MANAGER"],
      required: true,
    },
    waitress: { type: Schema.Types.ObjectId, ref: "Waitress" },
    cook: { type: Schema.Types.ObjectId, ref: "Cook" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    jobTitle: { type: Schema.Types.ObjectId, ref: "JobTitle" },
    periodStart: {
      type: Date,
      required: [true, "Le début de période est requis"],
    },
    periodEnd: {
      type: Date,
      required: [true, "La fin de période est requise"],
    },
    baseSalary: {
      type: Number,
      min: [0, "Le salaire ne peut pas être négatif"],
    },
    bonuses: [
      {
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    bonusName: {
      type: String,
      trim: true,
    },
    bonusAmount: {
      type: Number,
      default: 0,
      min: [0, "Le bonus ne peut pas être négatif"],
    },
    amount: {
      type: Number,
      required: [true, "Le montant est requis"],
      min: [0, "Le montant ne peut pas être négatif"],
    },
    paidAt: {
      type: Date,
      required: [true, "La date de paiement est requise"],
    },
    comment: {
      type: String,
      trim: true,
    },
    attachmentUrl: {
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

PayrollSchema.index({ paidAt: -1 });
PayrollSchema.index({ beneficiaryType: 1, paidAt: -1 });

const existingModel = mongoose.models.Payroll as Model<IPayrollDocument> | undefined;
if (
  existingModel?.schema.path("supervisor") ||
  (existingModel && !existingModel.schema.path("bonusAmount")) ||
  (existingModel && !existingModel.schema.path("bonuses"))
) {
  mongoose.deleteModel("Payroll");
}

const Payroll: Model<IPayrollDocument> =
  (mongoose.models.Payroll as Model<IPayrollDocument> | undefined) ||
  mongoose.model<IPayrollDocument>("Payroll", PayrollSchema);

export default Payroll;
