import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import AppSetting from "@/models/AppSetting";
import { GLOBAL_SETTINGS_KEY } from "@/lib/app-settings";
import { uploadBrandingLogo } from "@/lib/media-storage.server";

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  return "webp";
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["directeur", "directrice"]);
  if (error) return error;

  await connectDB();

  const formData = await req.formData();
  const file = formData.get("logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier logo manquant" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez PNG, JPG ou WEBP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Le fichier dépasse 3MB." }, { status: 400 });
  }

  try {
    const ext = extensionForMimeType(file.type);
    const fileName = `logo-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const logoUrl = await uploadBrandingLogo(buffer, fileName, file.type);

    await AppSetting.findOneAndUpdate(
      { key: GLOBAL_SETTINGS_KEY },
      { $set: { logoUrl }, $setOnInsert: { key: GLOBAL_SETTINGS_KEY } },
      { upsert: true, strict: false }
    );

    return NextResponse.json({ logoUrl });
  } catch (err) {
    console.error("[settings/logo]", err);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le logo. Vérifiez la configuration du stockage." },
      { status: 500 }
    );
  }
}
