import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import PasswordReset from "@/models/PasswordReset";

const RESET_TOKEN_BYTES = 32;
const RESET_EXPIRY_MS = 30 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
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

  const { email: emailRaw, otp: otpRaw } = body as { email?: unknown; otp?: unknown };
  const email = normalizeEmail(String(emailRaw ?? ""));
  const otp = String(otpRaw ?? "").replace(/\D/g, "");

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  if (otp.length !== 6) {
    return NextResponse.json({ error: "Le code doit comporter 6 chiffres." }, { status: 400 });
  }

  await connectDB();

  const record = await PasswordReset.findOne({ email });
  if (!record?.otpHash || !record.otpExpiresAt) {
    return NextResponse.json({ error: "Aucune demande en cours pour cet email. Demandez un nouveau code." }, { status: 400 });
  }

  if (record.otpExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Ce code a expiré. Demandez un nouveau code." }, { status: 400 });
  }

  if (record.otpAttempts >= MAX_OTP_ATTEMPTS) {
    return NextResponse.json(
      { error: "Trop de tentatives incorrectes. Demandez un nouveau code depuis la page précédente." },
      { status: 429 }
    );
  }

  const match = await bcrypt.compare(otp, record.otpHash);
  if (!match) {
    record.otpAttempts += 1;
    await record.save();
    return NextResponse.json({ error: "Code incorrect." }, { status: 400 });
  }

  const resetToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const resetTokenHash = hashResetToken(resetToken);
  const resetExpiresAt = new Date(Date.now() + RESET_EXPIRY_MS);

  record.otpHash = null;
  record.otpExpiresAt = null;
  record.otpAttempts = 0;
  record.resetTokenHash = resetTokenHash;
  record.resetExpiresAt = resetExpiresAt;
  await record.save();

  return NextResponse.json({ resetToken });
}
