import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IExpenseDocument extends Document {
  label: string;
  category: Types.ObjectId;
  amount: number;
  date: Date;
  paymentMethod: Types.ObjectId;
  comment?: string;
  attachmentUrl?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    label: {
      type: String,
      required: [true, "Le libellé est requis"],
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: [true, "La catégorie est requise"],
    },
    amount: {
      type: Number,
      required: [true, "Le montant est requis"],
      min: [0, "Le montant ne peut pas être négatif"],
    },
    date: {
      type: Date,
      required: [true, "La date est requise"],
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "ExpensePaymentMethod",
      required: [true, "Le mode de paiement est requis"],
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

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1, date: -1 });

const Expense: Model<IExpenseDocument> =
  (mongoose.models.Expense as Model<IExpenseDocument> | undefined) ||
  mongoose.model<IExpenseDocument>("Expense", ExpenseSchema);

export default Expense;
