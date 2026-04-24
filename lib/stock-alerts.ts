import { Resend } from "resend";
import User from "@/models/User";
import AppSetting from "@/models/AppSetting";
import { GLOBAL_SETTINGS_KEY, normalizeEmailList } from "@/lib/app-settings";

const STOCK_ALERT_LEVEL = 5;

function resendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function getDirectorEmails(): Promise<string[]> {
  const directors = await User.find({ role: "directeur" }).select("email").lean();
  return directors.map((u) => u.email).filter(Boolean);
}

async function getConfiguredLowStockEmails(): Promise<string[]> {
  const settings = await AppSetting.findOne({ key: GLOBAL_SETTINGS_KEY })
    .select("lowStockAlertEmails")
    .lean();

  const configuredEmails = normalizeEmailList(settings?.lowStockAlertEmails);
  if (configuredEmails.length > 0) return configuredEmails;
  return getDirectorEmails();
}

async function sendResendLowStock(productName: string, stock: number): Promise<void> {
  const resend = resendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resend || !fromEmail) {
    console.warn("[stock-alerts] Resend non configuré (RESEND_API_KEY ou RESEND_FROM_EMAIL manquant)");
    return;
  }

  const fromName = process.env.SMTP_FROM_NAME ?? "e-Restaurant";
  const from = `${fromName} <${fromEmail}>`;
  const to = await getConfiguredLowStockEmails();
  if (to.length === 0) {
    console.warn("[stock-alerts] Aucun utilisateur avec le rôle directeur pour l’envoi email");
    return;
  }

  const subject = `[e-Restaurant] Stock faible : ${productName}`;
  const html = `
    <p>Bonjour,</p>
    <p>Après une vente clôturée, le produit <strong>${escapeHtml(productName)}</strong> est à <strong>${stock}</strong> unité(s) en stock (seuil d’alerte : 5 ou moins).</p>
    <p>Pensez à réapprovisionner.</p>
  `;

  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    console.error("[stock-alerts] Resend:", error);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LOW_STOCK_MAX = STOCK_ALERT_LEVEL;

/**
 * Après chaque vente clôturée : alerte email (Resend) si le stock du produit est ≤ 5 (y compris rupture à 0).
 */
export async function notifyLowStockAfterSaleIfNeeded(input: {
  productName: string;
  stockAfterSale: number;
}): Promise<void> {
  const { productName, stockAfterSale } = input;
  if (stockAfterSale > LOW_STOCK_MAX) {
    return;
  }

  await sendResendLowStock(productName, stockAfterSale).catch((e) =>
    console.error("[stock-alerts] email", e)
  );
}
