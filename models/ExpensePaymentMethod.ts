import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpensePaymentMethodDocument extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpensePaymentMethodSchema = new Schema<IExpensePaymentMethodDocument>(
  {
    name: {
      type: String,
      required: [true, "Le nom du mode de paiement est requis"],
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const ExpensePaymentMethod: Model<IExpensePaymentMethodDocument> =
  (mongoose.models.ExpensePaymentMethod as Model<IExpensePaymentMethodDocument> | undefined) ||
  mongoose.model<IExpensePaymentMethodDocument>("ExpensePaymentMethod", ExpensePaymentMethodSchema);

export default ExpensePaymentMethod;
