import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { OPERATIONS_ROLES } from "@/lib/roles";
import AccountingPeriod from "@/models/AccountingPeriod";
import "@/models/User";
import { getAccountingOpening } from "@/lib/accounting";
import { parseAccountingInstant } from "@/lib/accounting-window";

export async function GET() {
  const { error } = await requireAuth([...OPERATIONS_ROLES]);
  if (error) return error;

  await connectDB();
  await getAccountingOpening();
  const item = await AccountingPeriod.findOne()
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json(item);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth([...OPERATIONS_ROLES]);
  if (error) return error;

  await connectDB();
  const existing = await getAccountingOpening();
  if (existing) {
    return NextResponse.json({ error: "Un solde d’ouverture existe déjà" }, { status: 409 });
  }

  const body = await req.json();
  const openingBalance = Number(body?.openingBalance);
  if (!Number.isFinite(openingBalance) || openingBalance < 0) {
    return NextResponse.json({ error: "Solde d’ouverture invalide" }, { status: 400 });
  }

  let openedAt: Date;
  try {
    openedAt = parseAccountingInstant(typeof body?.openedAt === "string" ? body.openedAt : null);
  } catch {
    return NextResponse.json({ error: "Date d’ouverture invalide" }, { status: 400 });
  }

  const period = await AccountingPeriod.create({
    openingBalance,
    openedAt,
    note: typeof body?.note === "string" ? body.note.trim() : undefined,
    createdBy: session!.user.id,
  });
  await period.populate("createdBy", "firstName lastName");
  return NextResponse.json(period, { status: 201 });
}
