import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import Waitress from "@/models/Waitress";
import Sale from "@/models/Sale";
import "@/models/JobTitle";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const waitress = await Waitress.findById(id).populate("jobTitle", "name salary");
  if (!waitress) {
    return NextResponse.json({ error: "Serveuse introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    ...waitress.toObject(),
    isActive: waitress.isActive !== false,
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
      return NextResponse.json({ error: "Serveuse introuvable" }, { status: 404 });
    }

    const updateResult = await Waitress.collection.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { isActive } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Serveuse introuvable" }, { status: 404 });
    }

    const updated = await Waitress.findById(id).populate("jobTitle", "name salary");
    if (!updated) {
      return NextResponse.json({ error: "Serveuse introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated.toObject(),
      isActive,
    });
  }

  const waitress = await Waitress.findById(id);
  if (!waitress) {
    return NextResponse.json({ error: "Serveuse introuvable" }, { status: 404 });
  }

  const { firstName, lastName, phone, paymentMode, jobTitle } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }
  if (paymentMode !== "CASH" && paymentMode !== "MOBILE_MONEY") {
    return NextResponse.json({ error: "Le mode de paiement est requis" }, { status: 400 });
  }

  waitress.firstName = String(firstName).trim();
  waitress.lastName = String(lastName).trim();
  waitress.phone =
    phone != null && String(phone).trim() !== "" ? String(phone).trim() : undefined;
  waitress.paymentMode = paymentMode;
  waitress.jobTitle = jobTitle || undefined;
  await waitress.save();
  await waitress.populate("jobTitle", "name salary");

  return NextResponse.json({
    ...waitress.toObject(),
    isActive: waitress.isActive !== false,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const used = await Sale.exists({ waitress: id });
  if (used) {
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer : des ventes sont liées à cette serveuse. Désactivez-la plutôt.",
      },
      { status: 409 }
    );
  }

  const waitress = await Waitress.findByIdAndDelete(id);
  if (!waitress) {
    return NextResponse.json({ error: "Serveuse introuvable" }, { status: 404 });
  }

  return NextResponse.json({ message: "Serveuse supprimée" });
}
