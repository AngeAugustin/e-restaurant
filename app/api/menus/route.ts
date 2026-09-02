import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import { isAllowedProductImageUrl } from "@/lib/media-urls";
import Menu from "@/models/Menu";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const activeOnly = req.nextUrl.searchParams.get("activeOnly") === "1";
  const filter = activeOnly ? { isActive: true } : {};
  const menus = await Menu.find(filter).sort({ name: 1 }).lean();
  return NextResponse.json(menus);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const imageRaw = typeof body?.image === "string" ? body.image.trim() : "";
    const image = imageRaw || "";
    const price = Number(body?.price);

    if (!name) {
      return NextResponse.json({ error: "Le nom du menu est requis" }, { status: 400 });
    }
    if (image && !isAllowedProductImageUrl(image)) {
      return NextResponse.json({ error: "URL de photo invalide" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Le prix doit être strictement positif" }, { status: 400 });
    }

    const existing = await Menu.findOne({ name });
    if (existing) {
      return NextResponse.json({ error: "Un menu avec ce nom existe déjà" }, { status: 409 });
    }

    const menu = await Menu.create({ name, image, price, isActive: true });
    return NextResponse.json(menu, { status: 201 });
  } catch (err) {
    console.error("[menus POST]", err);
    const message =
      err instanceof Error && /duplicate key/i.test(err.message)
        ? "Un menu avec ce nom existe déjà"
        : "Impossible de créer le menu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
