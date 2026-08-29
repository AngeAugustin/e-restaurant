import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth-middleware";
import { uploadProductImage } from "@/lib/media-storage.server";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const extByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
  }

  const mime = file.type;
  if (!ALLOWED.has(mime)) {
    return NextResponse.json(
      { error: "Format non pris en charge (JPEG, PNG, WebP, GIF, PDF)" },
      { status: 400 }
    );
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = extByMime[mime];
    const name = `${randomUUID()}${ext}`;
    const url = await uploadProductImage(buf, name, mime);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[media-upload]", err);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le fichier. Vérifiez la configuration du stockage." },
      { status: 500 }
    );
  }
}
