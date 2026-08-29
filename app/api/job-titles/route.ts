import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import JobTitle from "@/models/JobTitle";
import { isPayrollType, PAYROLL_TYPE_LABEL } from "@/lib/payroll";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const titles = await JobTitle.find({ beneficiaryType: { $exists: true } }).lean();
  const order = { WAITRESS: 0, COOK: 1, MANAGER: 2 } as const;
  titles.sort(
    (a, b) =>
      (order[a.beneficiaryType as keyof typeof order] ?? 9) -
      (order[b.beneficiaryType as keyof typeof order] ?? 9)
  );
  return NextResponse.json(titles);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const beneficiaryType = body?.beneficiaryType;
  const salary = Number(body?.salary);

  if (!isPayrollType(beneficiaryType)) {
    return NextResponse.json({ error: "Le type de fonction est requis" }, { status: 400 });
  }
  if (!Number.isFinite(salary) || salary < 0) {
    return NextResponse.json({ error: "Salaire invalide" }, { status: 400 });
  }

  const existing = await JobTitle.findOne({ beneficiaryType });
  if (existing) {
    return NextResponse.json(
      { error: `Un salaire est déjà défini pour « ${PAYROLL_TYPE_LABEL[beneficiaryType]} »` },
      { status: 409 }
    );
  }

  const byName = await JobTitle.findOne({ name: PAYROLL_TYPE_LABEL[beneficiaryType], beneficiaryType: { $exists: false } });
  if (byName) {
    byName.beneficiaryType = beneficiaryType;
    byName.salary = salary;
    await byName.save();
    return NextResponse.json(byName, { status: 201 });
  }

  const title = await JobTitle.create({
    beneficiaryType,
    name: PAYROLL_TYPE_LABEL[beneficiaryType],
    salary,
  });
  return NextResponse.json(title, { status: 201 });
}
