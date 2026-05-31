import "server-only";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import ProductImage from "@/models/ProductImage";
import { parseProductImageId, productImagePublicPath } from "@/lib/media-urls";

export async function saveProductImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  await connectDB();
  const doc = await ProductImage.create({
    data: buffer,
    filename,
    contentType,
  });
  return productImagePublicPath(String(doc._id));
}

export async function readProductImageById(
  id: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const doc = await ProductImage.findById(id).select("data contentType");
  if (!doc?.data?.length) return null;
  return {
    buffer: doc.data,
    contentType: doc.contentType || "application/octet-stream",
  };
}

export async function readProductImageFromUrl(
  urlOrPath: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const id = parseProductImageId(urlOrPath);
  if (!id) return null;
  return readProductImageById(id);
}
