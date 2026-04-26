import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import User from "@/models/User";

const patchBodySchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis").max(100),
  lastName: z.string().trim().min(1, "Le nom est requis").max(100),
  phone: z.string().trim().max(40).optional().default(""),
});

export async function GET() {
  const { session, error } = await requireAuth(["directeur", "gerant"]);
  if (error) return error;

  await connectDB();
  const user = await User.findById(session!.user.id)
    .select("firstName lastName email phone role")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
  });
}

export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth(["directeur", "gerant"]);
  if (error) return error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { firstName, lastName, phone } = parsed.data;

  await connectDB();
  const user = await User.findByIdAndUpdate(
    session!.user.id,
    { $set: { firstName, lastName, phone } },
    { new: true, runValidators: true }
  )
    .select("firstName lastName email phone role")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
  });
}
