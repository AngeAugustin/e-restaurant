import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES, OPERATIONS_ROLES } from "@/lib/roles";
import ExpensePaymentMethod from "@/models/ExpensePaymentMethod";

const DEFAULT_METHODS = ["Espèces", "Mobile Money", "Virement"];

export async function GET() {
  const { error } = await requireAuth([...OPERATIONS_ROLES]);
  if (error) return error;

  await connectDB();
  const count = await ExpensePaymentMethod.countDocuments();
  if (count === 0) {
    await ExpensePaymentMethod.insertMany(DEFAULT_METHODS.map((name) => ({ name })));
  }
  const methods = await ExpensePaymentMethod.find().sort({ name: 1 }).lean();
  return NextResponse.json(methods);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Le nom du mode de paiement est requis" }, { status: 400 });

  const existing = await ExpensePaymentMethod.findOne({ name });
  if (existing) {
    return NextResponse.json({ error: "Ce mode de paiement existe déjà" }, { status: 409 });
  }

  const method = await ExpensePaymentMethod.create({ name });
  return NextResponse.json(method, { status: 201 });
}
