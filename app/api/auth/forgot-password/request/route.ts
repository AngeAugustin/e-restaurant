import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import { sendPasswordResetOtpEmail } from "@/lib/password-reset-email";

const OTP_EXPIRY_MS = 15 * 60 * 1000;
const BCRYPT_OTP_ROUNDS = 8;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function generateSixDigitOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const emailRaw = typeof body === "object" && body !== null && "email" in body ? String((body as { email: unknown }).email) : "";
  const email = normalizeEmail(emailRaw);
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOne({ email }).lean();
  const genericMessage =
    "Si un compte est associé à cette adresse, un code à 6 chiffres vient d’y être envoyé. Vérifiez aussi les courriers indésirables.";

  if (!user) {
    return NextResponse.json({ message: genericMessage });
  }

  const otp = generateSixDigitOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_OTP_ROUNDS);
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await PasswordReset.findOneAndUpdate(
    { email },
    {
      $set: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        resetTokenHash: null,
        resetExpiresAt: null,
      },
    },
    { upsert: true, new: true }
  );

  const send = await sendPasswordResetOtpEmail(email, otp);
  if (!send.ok) {
    console.error("[forgot-password] email:", send.error);
    return NextResponse.json(
      { error: "Impossible d’envoyer l’email pour le moment. Réessayez plus tard ou contactez un administrateur." },
      { status: 503 }
    );
  }

  return NextResponse.json({ message: genericMessage });
}
