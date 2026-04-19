import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";

const MIN_PASSWORD = 6;
const BCRYPT_PASSWORD_ROUNDS = 10;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { email: emailRaw, resetToken: resetTokenRaw, password, confirmPassword } = body as {
    email?: unknown;
    resetToken?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
  };

  const email = normalizeEmail(String(emailRaw ?? ""));
  const resetToken = String(resetTokenRaw ?? "").trim();
  const pwd = String(password ?? "");
  const pwd2 = String(confirmPassword ?? "");

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  if (!resetToken) {
    return NextResponse.json({ error: "Jeton de réinitialisation manquant." }, { status: 400 });
  }
  if (pwd.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.` },
      { status: 400 }
    );
  }
  if (pwd !== pwd2) {
    return NextResponse.json({ error: "Les mots de passe ne correspondent pas." }, { status: 400 });
  }

  await connectDB();

  const record = await PasswordReset.findOne({ email });
  if (!record?.resetTokenHash || !record.resetExpiresAt) {
    return NextResponse.json({ error: "Session expirée ou invalide. Recommencez depuis le début." }, { status: 400 });
  }

  if (record.resetExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "La session de réinitialisation a expiré. Recommencez depuis le début." }, { status: 400 });
  }

  const incomingHash = hashResetToken(resetToken);
  if (!timingSafeEqualHex(incomingHash, record.resetTokenHash)) {
    return NextResponse.json({ error: "Jeton de réinitialisation invalide." }, { status: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) {
    await PasswordReset.deleteOne({ email });
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  user.password = await bcrypt.hash(pwd, BCRYPT_PASSWORD_ROUNDS);
  await user.save();
  await PasswordReset.deleteOne({ email });

  return NextResponse.json({ message: "Mot de passe mis à jour. Vous pouvez vous connecter." });
}
