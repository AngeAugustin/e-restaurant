import { Resend } from "resend";

function resendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPasswordResetOtpEmail(to: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = resendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resend || !fromEmail) {
    return { ok: false, error: "Envoi d’email non configuré (RESEND_API_KEY ou RESEND_FROM_EMAIL)." };
  }

  const fromName = process.env.SMTP_FROM_NAME ?? "e-Restaurant";
  const from = `${fromName} <${fromEmail}>`;
  const subject = "[e-Restaurant] Code de réinitialisation du mot de passe";
  const html = `
    <p>Bonjour,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe. Voici votre code à <strong>6 chiffres</strong> (valide 15 minutes) :</p>
    <p style="font-size: 28px; letter-spacing: 0.25em; font-weight: bold;">${escapeHtml(code)}</p>
    <p>Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</p>
  `;

  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) {
    return { ok: false, error: typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "Erreur d’envoi email." };
  }
  return { ok: true };
}
