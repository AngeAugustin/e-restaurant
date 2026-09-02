import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import Cook from "@/models/Cook";
import "@/models/JobTitle";

const PAYMENT_MODES = new Set(["CASH", "MOBILE_MONEY"]);

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const activeOnly = req.nextUrl.searchParams.get("activeOnly") === "1";
  const filter = activeOnly ? { isActive: true } : {};
  const cooks = await Cook.find(filter)
    .populate("jobTitle", "name salary")
    .sort({ firstName: 1 })
    .lean();
  return NextResponse.json(cooks);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const body = await req.json();
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

  const cook = await Cook.create({
    firstName,
    lastName,
    phone,
    photo: photo || undefined,
    paymentMode,
    jobTitle: jobTitle || undefined,
    isActive: true,
  });
  await cook.populate("jobTitle", "name salary");
  return NextResponse.json(cook, { status: 201 });
}
