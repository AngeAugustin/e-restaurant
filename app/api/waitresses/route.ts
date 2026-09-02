import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import Waitress from "@/models/Waitress";
import "@/models/JobTitle";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const activeOnly = req.nextUrl.searchParams.get("activeOnly") === "1";
  const filter = activeOnly ? { isActive: { $ne: false } } : {};
  const waitresses = await Waitress.find(filter)
    .populate("jobTitle", "name salary")
    .sort({ firstName: 1 })
    .lean();

  return NextResponse.json(
    waitresses.map((w) => ({
      ...w,
      isActive: w.isActive !== false,
    }))
  );
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["directeur","directrice"]);
  if (error) return error;

  await connectDB();
  const body = await req.json();
  const { firstName, lastName, phone, paymentMode, jobTitle } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }
  if (paymentMode !== "CASH" && paymentMode !== "MOBILE_MONEY") {
    return NextResponse.json({ error: "Le mode de paiement est requis" }, { status: 400 });
  }

  const waitress = await Waitress.create({
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    phone: phone != null && String(phone).trim() !== "" ? String(phone).trim() : undefined,
    paymentMode,
    jobTitle: jobTitle || undefined,
    isActive: true,
  });
  return NextResponse.json(waitress, { status: 201 });
}
