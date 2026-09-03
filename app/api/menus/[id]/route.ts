import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { OPERATIONS_ROLES } from "@/lib/roles";
import { isAllowedProductImageUrl } from "@/lib/media-urls";
import Menu from "@/models/Menu";
import KitchenOrder from "@/models/KitchenOrder";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const menu = await Menu.findById(id);
  if (!menu) return NextResponse.json({ error: "Menu introuvable" }, { status: 404 });
  return NextResponse.json(menu);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth([...OPERATIONS_ROLES]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const menu = await Menu.findById(id);
  if (!menu) return NextResponse.json({ error: "Menu introuvable" }, { status: 404 });

  if (body?.action === "deactivate") {
    menu.isActive = false;
    await menu.save();
    return NextResponse.json(menu);
  }
  if (body?.action === "activate") {
    menu.isActive = true;
    await menu.save();
    return NextResponse.json(menu);
  }

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const imageRaw = typeof body?.image === "string" ? body.image.trim() : "";
  const image = imageRaw || menu.image || "";
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

  const duplicate = await Menu.findOne({ name, _id: { $ne: id } });
  if (duplicate) {
    return NextResponse.json({ error: "Un menu avec ce nom existe déjà" }, { status: 409 });
  }

  try {
    menu.name = name;
    menu.image = image;
    menu.price = price;
    await menu.save();
    return NextResponse.json(menu);
  } catch (err) {
    console.error("[menus PUT]", err);
    return NextResponse.json({ error: "Impossible de modifier le menu" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const used = await KitchenOrder.exists({ "items.menu": id });
  if (used) {
    return NextResponse.json(
      { error: "Impossible de supprimer : des commandes sont liées à ce menu. Désactivez-le plutôt." },
      { status: 409 }
    );
  }

  const menu = await Menu.findByIdAndDelete(id);
  if (!menu) return NextResponse.json({ error: "Menu introuvable" }, { status: 404 });
  return NextResponse.json({ message: "Menu supprimé" });
}
