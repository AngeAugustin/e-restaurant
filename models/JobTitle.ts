import mongoose, { Schema, Document, Model } from "mongoose";
import type { PayrollBeneficiaryType } from "@/types";
import { PAYROLL_TYPE_LABEL } from "@/lib/payroll";

export interface IJobTitleDocument extends Document {
  beneficiaryType: PayrollBeneficiaryType;
  name: string;
  salary: number;
  createdAt: Date;
  updatedAt: Date;
}

const JobTitleSchema = new Schema<IJobTitleDocument>(
  {
    beneficiaryType: {
      type: String,
      enum: ["WAITRESS", "COOK", "MANAGER"],
      required: [true, "Le type est requis"],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Le nom de la fonction est requis"],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, "Le salaire est requis"],
      min: [0, "Le salaire ne peut pas être négatif"],
    },
  },
  { timestamps: true }
);

JobTitleSchema.pre("validate", function (next) {
  if (this.beneficiaryType) {
    this.name = PAYROLL_TYPE_LABEL[this.beneficiaryType];
  }
  next();
});

const existingModel = mongoose.models.JobTitle as Model<IJobTitleDocument> | undefined;
if (existingModel && !existingModel.schema.path("beneficiaryType")) {
  mongoose.deleteModel("JobTitle");
}

const JobTitle: Model<IJobTitleDocument> =
  (mongoose.models.JobTitle as Model<IJobTitleDocument> | undefined) ||
  mongoose.model<IJobTitleDocument>("JobTitle", JobTitleSchema);

export default JobTitle;
