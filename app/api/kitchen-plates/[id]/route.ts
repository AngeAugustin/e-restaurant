import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import KitchenPlate from "@/models/KitchenPlate";
import KitchenOrder from "@/models/KitchenOrder";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const number = typeof body?.number === "string" ? body.number.trim() : String(body?.number ?? "").trim();

  if (!number) {
    return NextResponse.json({ error: "Le numéro de plaquette est requis" }, { status: 400 });
  }

  const duplicate = await KitchenPlate.findOne({ number, _id: { $ne: id } });
  if (duplicate) {
    return NextResponse.json({ error: "Ce numéro de plaquette est déjà utilisé" }, { status: 409 });
  }

  const plate = await KitchenPlate.findByIdAndUpdate(id, { number }, { new: true, runValidators: true });
  if (!plate) return NextResponse.json({ error: "Plaquette introuvable" }, { status: 404 });
  return NextResponse.json(plate);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const used = await KitchenOrder.exists({ plate: id });
  if (used) {
    return NextResponse.json(
      { error: "Impossible de supprimer : des commandes sont liées à cette plaquette" },
      { status: 409 }
    );
  }

  const plate = await KitchenPlate.findByIdAndDelete(id);
  if (!plate) return NextResponse.json({ error: "Plaquette introuvable" }, { status: 404 });
  return NextResponse.json({ message: "Plaquette supprimée" });
}
