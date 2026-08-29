import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import KitchenPlate from "@/models/KitchenPlate";
import KitchenOrder from "@/models/KitchenOrder";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const plates = await KitchenPlate.find().sort({ number: 1 }).lean();

  const pending = await KitchenOrder.find({ status: "PENDING" }).select("plate").lean();
  const occupied = new Map<string, string>();
  for (const order of pending) {
    const pid = String(order.plate);
    if (!occupied.has(pid)) occupied.set(pid, String(order._id));
  }

  return NextResponse.json(
    plates.map((p) => ({
      ...p,
      occupiedByPendingOrderId: occupied.get(String(p._id)) ?? null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const number = typeof body?.number === "string" ? body.number.trim() : String(body?.number ?? "").trim();

  if (!number) {
    return NextResponse.json({ error: "Le numéro de plaquette est requis" }, { status: 400 });
  }

  const taken = await KitchenPlate.findOne({ number });
  if (taken) {
    return NextResponse.json({ error: "Ce numéro de plaquette est déjà utilisé" }, { status: 409 });
  }

  const plate = await KitchenPlate.create({ number });
  return NextResponse.json(plate, { status: 201 });
}
