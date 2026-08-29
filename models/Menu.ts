import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMenuDocument extends Document {
  name: string;
  image: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSchema = new Schema<IMenuDocument>(
  {
    name: {
      type: String,
      required: [true, "Le nom du menu est requis"],
      trim: true,
      unique: true,
    },
    image: {
      type: String,
      required: [true, "La photo du menu est requise"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Le prix est requis"],
      validate: {
        validator(v: number) {
          return Number.isFinite(v) && v > 0;
        },
        message: "Le prix doit être strictement positif",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Menu: Model<IMenuDocument> =
  (mongoose.models.Menu as Model<IMenuDocument> | undefined) ||
  mongoose.model<IMenuDocument>("Menu", MenuSchema);

export default Menu;
