import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import AccountingPeriod from "@/models/AccountingPeriod";
import "@/models/User";
import { parseAccountingInstant } from "@/lib/accounting-window";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const period = await AccountingPeriod.findById(id);
  if (!period) return NextResponse.json({ error: "Solde d’ouverture introuvable" }, { status: 404 });

  const body = await req.json();
  const openingBalance = Number(body?.openingBalance);
  if (!Number.isFinite(openingBalance) || openingBalance < 0) {
    return NextResponse.json({ error: "Solde d’ouverture invalide" }, { status: 400 });
  }

  let openedAt: Date;
  try {
    openedAt = parseAccountingInstant(typeof body?.openedAt === "string" ? body.openedAt : period.openedAt.toISOString());
  } catch {
    return NextResponse.json({ error: "Date d’ouverture invalide" }, { status: 400 });
  }

  period.openingBalance = openingBalance;
  period.openedAt = openedAt;
  period.note = typeof body?.note === "string" ? body.note.trim() : undefined;
  await period.save();
  await period.populate("createdBy", "firstName lastName");
  return NextResponse.json(period);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const period = await AccountingPeriod.findByIdAndDelete(id);
  if (!period) return NextResponse.json({ error: "Solde d’ouverture introuvable" }, { status: 404 });
  return NextResponse.json({ message: "Solde d’ouverture supprimé" });
}
