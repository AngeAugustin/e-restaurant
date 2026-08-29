import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWaitressDocument extends Document {
  firstName: string;
  lastName: string;
  phone?: string;
  paymentMode?: "CASH" | "MOBILE_MONEY";
  jobTitle?: Types.ObjectId;
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
  },
  { timestamps: true }
);

const existingModel = mongoose.models.Waitress as Model<IWaitressDocument> | undefined;

if (existingModel) {
  if (!existingModel.schema.path("paymentMode")) {
    existingModel.schema.add({
      paymentMode: { type: String, enum: ["CASH", "MOBILE_MONEY"] },
    });
  }
  if (!existingModel.schema.path("jobTitle")) {
    existingModel.schema.add({
      jobTitle: { type: Schema.Types.ObjectId, ref: "JobTitle" },
    });
  }
}

const Waitress: Model<IWaitressDocument> =
  existingModel || mongoose.model<IWaitressDocument>("Waitress", WaitressSchema);

export default Waitress;
