import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import User from "@/models/User";

const verifySchema = z.object({
  currentPassword: z.string().min(1, "Saisissez votre mot de passe actuel"),
});

const changeSchema = z.object({
  currentPassword: z.string().min(1, "Saisissez votre mot de passe actuel"),
  newPassword: z
    .string()
    .min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères")
    .max(128, "Mot de passe trop long"),
});

async function loadUserWithPassword(userId: string) {
  await connectDB();
  return User.findById(userId).select("password").lean();
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(["directeur", "gerant"]);
  if (error) return error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const user = await loadUserWithPassword(session!.user.id);
  if (!user?.password) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
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

  const parsed = changeSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await loadUserWithPassword(session!.user.id);
  if (!user?.password) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const currentOk = await bcrypt.compare(currentPassword, user.password);
  if (!currentOk) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 });
  }

  const sameAsBefore = await bcrypt.compare(newPassword, user.password);
  if (sameAsBefore) {
    return NextResponse.json(
      { error: "Le nouveau mot de passe doit être différent de l'actuel" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  const updated = await User.findByIdAndUpdate(
    session!.user.id,
    { $set: { password: hashed } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
