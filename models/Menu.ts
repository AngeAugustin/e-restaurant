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
      trim: true,
      default: "",
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

const MODEL_NAME = "Menu";
const existingMenu = mongoose.models[MODEL_NAME] as Model<IMenuDocument> | undefined;
if (existingMenu) {
  const imagePath = existingMenu.schema.path("image");
  if (imagePath) {
    imagePath.required(false);
    imagePath.default("");
  }
}

const Menu: Model<IMenuDocument> =
  existingMenu || mongoose.model<IMenuDocument>(MODEL_NAME, MenuSchema);

export default Menu;
