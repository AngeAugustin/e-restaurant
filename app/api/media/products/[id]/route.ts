import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { readProductImageById } from "@/lib/product-image.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const media = await readProductImageById(id);
  if (!media) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(media.buffer), {
    status: 200,
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(media.buffer.length),
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
