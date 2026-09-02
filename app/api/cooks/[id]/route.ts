import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import Cook from "@/models/Cook";
import KitchenOrder from "@/models/KitchenOrder";
import "@/models/JobTitle";

const PAYMENT_MODES = new Set(["CASH", "MOBILE_MONEY"]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const cook = await Cook.findById(id).populate("jobTitle", "name salary");
  if (!cook) return NextResponse.json({ error: "Cuisinière introuvable" }, { status: 404 });
  return NextResponse.json(cook);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const cook = await Cook.findById(id);
  if (!cook) return NextResponse.json({ error: "Cuisinière introuvable" }, { status: 404 });

  if (body?.action === "deactivate") {
    cook.isActive = false;
    await cook.save();
    return NextResponse.json(cook);
  }
  if (body?.action === "activate") {
    cook.isActive = true;
    await cook.save();
    return NextResponse.json(cook);
  }

  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const photo = typeof body?.photo === "string" ? body.photo.trim() : "";
  const paymentMode = body?.paymentMode;
  const jobTitle = body?.jobTitle;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Le numéro de téléphone est obligatoire" }, { status: 400 });
  }
  if (!PAYMENT_MODES.has(paymentMode)) {
    return NextResponse.json({ error: "Le mode de paiement est requis" }, { status: 400 });
  }

  cook.firstName = firstName;
  cook.lastName = lastName;
  cook.phone = phone;
  cook.photo = photo || undefined;
  cook.paymentMode = paymentMode;
  cook.jobTitle = jobTitle || undefined;
  await cook.save();
  await cook.populate("jobTitle", "name salary");
  return NextResponse.json(cook);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const used = await KitchenOrder.exists({ cook: id });
  if (used) {
    return NextResponse.json(
      { error: "Impossible de supprimer : des commandes sont liées à cette cuisinière. Désactivez-la plutôt." },
      { status: 409 }
    );
  }

  const cook = await Cook.findByIdAndDelete(id);
  if (!cook) return NextResponse.json({ error: "Cuisinière introuvable" }, { status: 404 });
  return NextResponse.json({ message: "Cuisinière supprimée" });
}
