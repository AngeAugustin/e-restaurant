import "server-only";

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { BLOB_STORAGE_URL } from "@/lib/media-urls";
import { readProductImageFromUrl, saveProductImage } from "@/lib/product-image.server";

const LOCAL_BRANDING_DIR = path.join(process.cwd(), "public", "uploads", "branding");

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

async function uploadToLocal(
  dir: string,
  fileName: string,
  buffer: Buffer,
  publicPrefix: string
): Promise<string> {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
  return `${publicPrefix}/${fileName}`;
}

export async function uploadProductImage(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  return saveProductImage(buffer, fileName, contentType);
}

export async function uploadBrandingLogo(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (hasBlobToken()) {
    const blob = await put(`branding/${fileName}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  return uploadToLocal(LOCAL_BRANDING_DIR, fileName, buffer, "/uploads/branding");
}

function mimeFromPathOrUrl(value: string): string {
  const ext = path.extname(value.split("?")[0]).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

async function readLocalPublicFile(publicPath: string): Promise<Buffer | null> {
  if (!publicPath.startsWith("/")) return null;
  const rel = publicPath.replace(/^\/+/, "");
  if (!rel || rel.includes("..")) return null;
  const pubRoot = path.resolve(process.cwd(), "public");
  const full = path.resolve(pubRoot, rel);
  const fromPub = path.relative(pubRoot, full);
  if (fromPub.startsWith("..") || path.isAbsolute(fromPub)) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

/** Charge une image locale (`/uploads/...`) ou distante (Vercel Blob) pour pièces jointes email. */
export async function readMediaBuffer(
  urlOrPath: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const value = urlOrPath.trim();
  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    if (!BLOB_STORAGE_URL.test(value)) return null;
    try {
      const res = await fetch(value, { cache: "no-store" });
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const contentType =
        res.headers.get("content-type")?.split(";")[0]?.trim() ||
        mimeFromPathOrUrl(value);
      return { buffer: Buffer.from(arrayBuffer), contentType };
    } catch {
      return null;
    }
  }

  const mongoMedia = await readProductImageFromUrl(value);
  if (mongoMedia) return mongoMedia;

  const buffer = await readLocalPublicFile(value);
  if (!buffer) return null;
  return { buffer, contentType: mimeFromPathOrUrl(value) };
}
