import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import JobTitle from "@/models/JobTitle";
import Payroll from "@/models/Payroll";
import { isPayrollType, PAYROLL_TYPE_LABEL } from "@/lib/payroll";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const beneficiaryType = body?.beneficiaryType;
  const salary = Number(body?.salary);

  if (!isPayrollType(beneficiaryType)) {
    return NextResponse.json({ error: "Le type de fonction est requis" }, { status: 400 });
  }
  if (!Number.isFinite(salary) || salary < 0) {
    return NextResponse.json({ error: "Salaire invalide" }, { status: 400 });
  }

  const duplicate = await JobTitle.findOne({ beneficiaryType, _id: { $ne: id } });
  if (duplicate) {
    return NextResponse.json(
      { error: `Un salaire est déjà défini pour « ${PAYROLL_TYPE_LABEL[beneficiaryType]} »` },
      { status: 409 }
    );
  }

  const title = await JobTitle.findByIdAndUpdate(
    id,
    { beneficiaryType, name: PAYROLL_TYPE_LABEL[beneficiaryType], salary },
    { new: true, runValidators: true }
  );
  if (!title) return NextResponse.json({ error: "Fonction introuvable" }, { status: 404 });
  return NextResponse.json(title);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const used = await Payroll.exists({ jobTitle: id });
  if (used) {
    return NextResponse.json(
      { error: "Impossible de supprimer : des fiches de paie sont liées à cette fonction" },
      { status: 409 }
    );
  }

  const title = await JobTitle.findByIdAndDelete(id);
  if (!title) return NextResponse.json({ error: "Fonction introuvable" }, { status: 404 });
  return NextResponse.json({ message: "Fonction supprimée" });
}
