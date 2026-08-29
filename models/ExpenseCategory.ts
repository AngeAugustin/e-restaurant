import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpenseCategoryDocument extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategorySchema = new Schema<IExpenseCategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Le nom de la catégorie est requis"],
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const ExpenseCategory: Model<IExpenseCategoryDocument> =
  (mongoose.models.ExpenseCategory as Model<IExpenseCategoryDocument> | undefined) ||
  mongoose.model<IExpenseCategoryDocument>("ExpenseCategory", ExpenseCategorySchema);

export default ExpenseCategory;
