import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import { parsePayrollBonuses, payrollBonusTotal } from "@/lib/payroll";
import { resolvePayrollBaseSalary } from "@/lib/payroll-server";
import Payroll from "@/models/Payroll";
import "@/models/Waitress";
import "@/models/Cook";
import "@/models/User";
import "@/models/JobTitle";

const TYPES = new Set(["WAITRESS", "COOK", "MANAGER"]);

export async function GET(req: NextRequest) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const url = req.nextUrl;
  const type = url.searchParams.get("type");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const filter: Record<string, unknown> = {};
  if (type && TYPES.has(type)) filter.beneficiaryType = type;
  else filter.beneficiaryType = { $in: [...TYPES] };
  if (from || to) {
    const paidAt: Record<string, Date> = {};
    if (from) paidAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      paidAt.$lte = end;
    }
    filter.paidAt = paidAt;
  }

  const [items, totals] = await Promise.all([
    Payroll.find(filter)
      .populate("waitress", "firstName lastName")
      .populate("cook", "firstName lastName")
      .populate("user", "firstName lastName role")
      .populate("jobTitle", "name salary")
      .populate("createdBy", "firstName lastName")
      .sort({ paidAt: -1, createdAt: -1 })
      .lean(),
    Payroll.aggregate<{ totalAmount: number; count: number }>([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  return NextResponse.json({
    items,
    stats: {
      totalAmount: totals[0]?.totalAmount ?? 0,
      count: totals[0]?.count ?? 0,
    },
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const beneficiaryType = body?.beneficiaryType;
  if (!TYPES.has(beneficiaryType)) {
    return NextResponse.json({ error: "Type de personnel invalide" }, { status: 400 });
  }

  let bonus: { bonuses: { name: string; amount: number }[] };
  try {
    bonus = parsePayrollBonuses(body);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bonus invalide" }, { status: 400 });
  }

  let baseSalary: number;
  try {
    baseSalary = await resolvePayrollBaseSalary(beneficiaryType, body?.jobTitle);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Salaire introuvable" }, { status: 400 });
  }

  const bonusTotal = payrollBonusTotal(bonus.bonuses);
  const amount = baseSalary + bonusTotal;

  const periodStart = body?.periodStart ? new Date(body.periodStart) : null;
  const periodEnd = body?.periodEnd ? new Date(body.periodEnd) : null;
  const paidAt = body?.paidAt ? new Date(body.paidAt) : null;
  if (!periodStart || Number.isNaN(periodStart.getTime()) || !periodEnd || Number.isNaN(periodEnd.getTime())) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }
  if (!paidAt || Number.isNaN(paidAt.getTime())) {
    return NextResponse.json({ error: "Date de paiement invalide" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    beneficiaryType,
    baseSalary,
    bonuses: bonus.bonuses,
    bonusName: bonus.bonuses[0]?.name,
    bonusAmount: bonusTotal,
    amount,
    periodStart,
    periodEnd,
    paidAt,
    comment: typeof body?.comment === "string" ? body.comment.trim() : undefined,
    attachmentUrl: typeof body?.attachmentUrl === "string" ? body.attachmentUrl.trim() : undefined,
    jobTitle: body?.jobTitle || undefined,
    createdBy: session!.user.id,
  };

  if (beneficiaryType === "WAITRESS") payload.waitress = new Types.ObjectId(body.personId);
  else if (beneficiaryType === "COOK") payload.cook = new Types.ObjectId(body.personId);
  else payload.user = new Types.ObjectId(body.personId);

  if (!body?.personId) {
    return NextResponse.json({ error: "Le bénéficiaire est requis" }, { status: 400 });
  }

  const payroll = await Payroll.create(payload);
  await payroll.populate("waitress", "firstName lastName");
  await payroll.populate("cook", "firstName lastName");
  await payroll.populate("user", "firstName lastName role");
  await payroll.populate("jobTitle", "name salary");
  await payroll.populate("createdBy", "firstName lastName");
  return NextResponse.json(payroll, { status: 201 });
}
