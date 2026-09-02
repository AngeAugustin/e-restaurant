import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import KitchenWaitress from "@/models/KitchenWaitress";
import KitchenOrder from "@/models/KitchenOrder";
import "@/models/JobTitle";

const PAYMENT_MODES = new Set(["CASH", "MOBILE_MONEY"]);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const row = await KitchenWaitress.findById(id).populate("jobTitle", "name salary");
  if (!row) {
    return NextResponse.json({ error: "Serveuse-cuisinière introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    ...row.toObject(),
    isActive: row.isActive !== false,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur", "directrice"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  if (body?.action === "deactivate" || body?.action === "activate") {
    const isActive = body.action === "activate";

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Serveuse-cuisinière introuvable" }, { status: 404 });
    }

    const updateResult = await KitchenWaitress.collection.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { isActive } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Serveuse-cuisinière introuvable" }, { status: 404 });
    }

    const updated = await KitchenWaitress.findById(id).populate("jobTitle", "name salary");
    if (!updated) {
      return NextResponse.json({ error: "Serveuse-cuisinière introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated.toObject(),
      isActive,
    });
  }

  const row = await KitchenWaitress.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Serveuse-cuisinière introuvable" }, { status: 404 });
  }

  const { firstName, lastName, phone, paymentMode, jobTitle } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }
  if (!PAYMENT_MODES.has(paymentMode)) {
    return NextResponse.json({ error: "Le mode de paiement est requis" }, { status: 400 });
  }

  row.firstName = String(firstName).trim();
  row.lastName = String(lastName).trim();
  row.phone =
    phone != null && String(phone).trim() !== "" ? String(phone).trim() : undefined;
  row.paymentMode = paymentMode;
  row.jobTitle = jobTitle || undefined;
  await row.save();
  await row.populate("jobTitle", "name salary");

  return NextResponse.json({
    ...row.toObject(),
    isActive: row.isActive !== false,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const used = await KitchenOrder.exists({ kitchenWaitress: id });
  if (used) {
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer : des commandes sont liées à cette serveuse-cuisinière. Désactivez-la plutôt.",
      },
      { status: 409 }
    );
  }

  const row = await KitchenWaitress.findByIdAndDelete(id);
  if (!row) {
    return NextResponse.json({ error: "Serveuse-cuisinière introuvable" }, { status: 404 });
  }

  return NextResponse.json({ message: "Serveuse-cuisinière supprimée" });
}
