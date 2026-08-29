import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import ExpensePaymentMethod from "@/models/ExpensePaymentMethod";
import Expense from "@/models/Expense";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Le nom du mode de paiement est requis" }, { status: 400 });

  const duplicate = await ExpensePaymentMethod.findOne({ name, _id: { $ne: id } });
  if (duplicate) {
    return NextResponse.json({ error: "Ce mode de paiement existe déjà" }, { status: 409 });
  }

  const method = await ExpensePaymentMethod.findByIdAndUpdate(id, { name }, { new: true, runValidators: true });
  if (!method) return NextResponse.json({ error: "Mode de paiement introuvable" }, { status: 404 });
  return NextResponse.json(method);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const used = await Expense.exists({ paymentMethod: id });
  if (used) {
    return NextResponse.json(
      { error: "Impossible de supprimer : des dépenses sont liées à ce mode de paiement" },
      { status: 409 }
    );
  }

  const method = await ExpensePaymentMethod.findByIdAndDelete(id);
  if (!method) return NextResponse.json({ error: "Mode de paiement introuvable" }, { status: 404 });
  return NextResponse.json({ message: "Mode de paiement supprimé" });
}
