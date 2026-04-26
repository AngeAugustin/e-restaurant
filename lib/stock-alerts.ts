import { readFile } from "fs/promises";
import path from "path";
import { Resend } from "resend";
import User from "@/models/User";
import AppSetting from "@/models/AppSetting";
import { connectDB } from "@/lib/db";
import { toAbsoluteUrl } from "@/lib/public-app-url";
import { saleTicketDisplayId } from "@/lib/sale-ticket-id";
import {
  GLOBAL_SETTINGS_KEY,
  normalizeEmailList,
  DEFAULT_SOLUTION_NAME,
  DEFAULT_LOGO_URL,
  normalizeSolutionName,
  isAllowedLogoUrl,
  normalizeHexColor,
  normalizeLowStockAlertThreshold,
} from "@/lib/app-settings";

const CID_LOGO = "e-stock-logo";

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

function escapeHtmlAttr(s: string) {
  return escapeHtml(s);
}

/** Pour `url('…')` dans un attribut `style` (guillemets simples). */
function cssSingleQuotedUrlFragment(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function isSafeProductImagePath(url: string): boolean {
  return /^\/uploads\/products\/[\w.-]+$/.test(url);
}

function formatFrenchDateTime(d: Date): string {
  try {
    return d.toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    });
  } catch {
    return d.toISOString();
  }
}

async function getDirectorEmails(): Promise<string[]> {
  const directors = await User.find({ role: "directeur" }).select("email").lean();
  return directors.map((u) => u.email).filter(Boolean);
}

type MailBranding = {
  to: string[];
  solutionName: string;
  logoPublicPath: string;
  logoAbsoluteFallback: string;
  accentColor: string;
  fromDisplayName: string;
};

async function resolveLowStockMailBranding(): Promise<MailBranding | null> {
  const doc = await AppSetting.findOne({ key: GLOBAL_SETTINGS_KEY })
    .select("lowStockAlertEmails solutionName logoUrl primaryColor")
    .lean();

  const configuredEmails = normalizeEmailList(doc?.lowStockAlertEmails);
  const to =
    configuredEmails.length > 0 ? configuredEmails : await getDirectorEmails();
  if (to.length === 0) {
    console.warn(
      "[stock-alerts] Aucun destinataire (emails d’alerte ou rôle directeur manquant)"
    );
    return null;
  }

  const solutionName = normalizeSolutionName(doc?.solutionName);
  const logoPublicPath =
    typeof doc?.logoUrl === "string" && isAllowedLogoUrl(doc.logoUrl)
      ? doc.logoUrl
      : DEFAULT_LOGO_URL;
  const logoAbsoluteFallback = toAbsoluteUrl(logoPublicPath);
  const accent =
    typeof doc?.primaryColor === "string" ? normalizeHexColor(doc.primaryColor) : null;
  const accentColor = accent ?? "#6366F1";
  const fromDisplayName =
    process.env.SMTP_FROM_NAME?.trim() || solutionName || DEFAULT_SOLUTION_NAME;

  return {
    to,
    solutionName,
    logoPublicPath,
    logoAbsoluteFallback,
    accentColor,
    fromDisplayName,
  };
}

async function readPublicStaticFile(publicPath: string): Promise<Buffer | null> {
  if (!publicPath.startsWith("/")) return null;
  const rel = publicPath.replace(/^\/+/, "");
  if (!rel || rel.includes("..")) return null;
  const pubRoot = path.resolve(process.cwd(), "public");
  const full = path.resolve(pubRoot, rel);
  const fromPub = path.relative(pubRoot, full);
  if (fromPub.startsWith("..") || path.isAbsolute(fromPub)) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

function mimeFromPublicPath(publicPath: string): string {
  const ext = path.extname(publicPath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

export type LowStockSaleLineInput = {
  productName: string;
  productCategory?: string;
  productImage?: string;
  stockBeforeSale: number;
  stockAfterSale: number;
  quantitySold: number;
};

type LowStockLineResolved = {
  productName: string;
  productCategory: string;
  productImagePublicPath: string;
  stockBeforeSale: number;
  stockAfterSale: number;
  quantitySold: number;
};

type LowStockBatchContext = {
  saleTicketNumber: string;
  lowStockAlertThreshold: number;
  lines: LowStockLineResolved[];
};

type AttachmentItem = {
  filename: string;
  content: Buffer;
  contentType: string;
  contentId: string;
};

function productCid(index: number): string {
  return `e-stock-p${index}`;
}

async function buildInlineImages(
  branding: MailBranding,
  lines: LowStockLineResolved[]
): Promise<{
  attachments: AttachmentItem[];
  logoSrc: string;
  lineImageSrcs: string[];
}> {
  const attachments: AttachmentItem[] = [];

  let logoSrc = branding.logoAbsoluteFallback;
  const logoBuf = await readPublicStaticFile(branding.logoPublicPath);
  if (logoBuf) {
    attachments.push({
      filename: path.basename(branding.logoPublicPath) || "logo.png",
      content: logoBuf,
      contentType: mimeFromPublicPath(branding.logoPublicPath),
      contentId: CID_LOGO,
    });
    logoSrc = `cid:${CID_LOGO}`;
  }

  const lineImageSrcs: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const publicPath = line.productImagePublicPath;
    if (!publicPath) {
      lineImageSrcs.push("");
      continue;
    }
    const prodBuf = await readPublicStaticFile(publicPath);
    const cid = productCid(i);
    if (prodBuf) {
      attachments.push({
        filename: path.basename(publicPath) || "product.jpg",
        content: prodBuf,
        contentType: mimeFromPublicPath(publicPath),
        contentId: cid,
      });
      lineImageSrcs.push(`cid:${cid}`);
    } else {
      lineImageSrcs.push(toAbsoluteUrl(publicPath));
    }
  }

  return { attachments, logoSrc, lineImageSrcs };
}

function buildLowStockBatchEmailHtml(
  branding: MailBranding,
  ctx: LowStockBatchContext,
  sentAt: Date,
  logoSrc: string,
  lineImageSrcs: string[]
): string {
  const accent = escapeHtml(branding.accentColor);
  const name = escapeHtml(branding.solutionName);
  const dateStr = escapeHtml(formatFrenchDateTime(sentAt));
  const ticket = escapeHtml(ctx.saleTicketNumber);
  const logoAttr = escapeHtmlAttr(logoSrc);
  const n = ctx.lines.length;
  const thr = ctx.lowStockAlertThreshold;

  const logRows = [
    ["Date et heure", dateStr],
    ["N° ticket", ticket],
    ["Produits sous le seuil", String(n)],
    ["Seuil d’alerte", `≤ ${thr} unité(s)`],
  ]
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#52525b;width:42%;vertical-align:top;">${escapeHtml(k)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#18181b;font-weight:600;vertical-align:top;">${v}</td>
      </tr>`
    )
    .join("");

  const productBlocks = ctx.lines
    .map((line, i) => {
      const pName = escapeHtml(line.productName);
      const pCat = escapeHtml(line.productCategory);
      const imgSrc = lineImageSrcs[i] ?? "";
      const productAttr = imgSrc ? escapeHtmlAttr(imgSrc) : "";
      const bgUrl = imgSrc ? cssSingleQuotedUrlFragment(imgSrc) : "";
      const thumb = imgSrc
        ? `<td width="112" valign="top" role="img" aria-label="Photo du produit : ${escapeHtmlAttr(line.productName)}" style="width:112px;min-width:112px;max-width:112px;padding:0;vertical-align:top;background-color:#e4e4e7;background-image:url('${bgUrl}');background-size:cover;background-position:center;background-repeat:no-repeat;border-radius:11px 0 0 11px;line-height:0;font-size:0;mso-line-height-rule:exactly;">
         <!--[if mso]><img src="${productAttr}" width="112" height="280" alt="" border="0" style="display:block;width:112px;height:280px;object-fit:cover;object-position:center;border:0;" /><![endif]-->
         <!--[if !mso]><!--><img src="${productAttr}" width="112" alt="" border="0" style="display:block;width:112px;height:100%;min-height:100%;object-fit:cover;object-position:center;border:0;outline:none;line-height:0;font-size:0;-ms-interpolation-mode:bicubic;" /><!--<![endif]-->
       </td>`
        : "";

      return `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="table-layout:fixed;width:100%;background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;margin-bottom:12px;border-collapse:separate;">
                <tr>
                  ${thumb}
                  <td style="padding:16px 16px 16px 16px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#18181b;">${pName}</p>
                    <p style="margin:0 0 8px;font-size:13px;color:#71717a;">${pCat || "—"}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#52525b;">Vendu sur cette ligne : <strong>${line.quantitySold}</strong></p>
                    <p style="margin:0 0 4px;font-size:13px;color:#52525b;">Stock avant → après : <strong>${line.stockBeforeSale} → ${line.stockAfterSale}</strong></p>
                    <p style="margin:0;font-size:18px;font-weight:800;color:${accent};">${line.stockAfterSale}<span style="font-size:13px;font-weight:600;color:#52525b;"> unité(s) restantes</span></p>
                  </td>
                </tr>
              </table>`;
    })
    .join("");

  const intro =
    n === 1
      ? "Suite à la <strong>clôture d’une vente</strong>, le stock du produit ci-dessous est passé sous le seuil d’alerte. Pensez à réapprovisionner."
      : `Suite à la <strong>clôture d’une vente</strong>, <strong>${n} produits</strong> sont passés sous le seuil d’alerte. Pensez à réapprovisionner.`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="height:4px;background:${accent};"></td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <img src="${logoAttr}" alt="${name}" width="120" height="auto" style="max-width:140px;height:auto;display:inline-block;border:0;outline:none;text-decoration:none;" />
              <p style="margin:12px 0 0;font-size:15px;font-weight:600;color:#18181b;">${name}</p>
              <p style="margin:6px 0 0;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Alerte stock</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 20px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#3f3f46;">Bonjour,</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#3f3f46;">
                ${intro}
              </p>
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;">Journal</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;margin-bottom:22px;">
                ${logRows}
              </table>
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;">Produit${n > 1 ? "s" : ""} concerné${n > 1 ? "s" : ""}</p>
              ${productBlocks}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;text-align:center;">
              Message automatique — ${name}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildLowStockBatchEmailText(
  branding: MailBranding,
  ctx: LowStockBatchContext,
  sentAt: Date
): string {
  const lines = ctx.lines.map(
    (l) =>
      `- ${l.productName}${l.productCategory ? ` (${l.productCategory})` : ""} : vendu ${l.quantitySold}, stock ${l.stockBeforeSale} → ${l.stockAfterSale} (reste ${l.stockAfterSale})`
  );
  return [
    `${branding.solutionName} — Alerte stock`,
    "",
    "Bonjour,",
    "",
    `N° ticket : ${ctx.saleTicketNumber}`,
    `Date : ${formatFrenchDateTime(sentAt)}`,
    `Produits sous le seuil (≤ ${ctx.lowStockAlertThreshold}) : ${ctx.lines.length}`,
    "",
    ...lines,
    "",
    "Pensez à réapprovisionner.",
  ].join("\n");
}

function buildBatchSubject(branding: MailBranding, ctx: LowStockBatchContext): string {
  const ticket = ctx.saleTicketNumber;
  if (ctx.lines.length === 1) {
    return `[${branding.solutionName}] Stock faible : ${ctx.lines[0].productName}`;
  }
  return `[${branding.solutionName}] Stock faible : ${ctx.lines.length} produits (ticket ${ticket})`;
}

async function sendResendLowStockBatch(ctx: LowStockBatchContext): Promise<void> {
  const resend = resendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resend || !fromEmail) {
    console.warn("[stock-alerts] Resend non configuré (RESEND_API_KEY ou RESEND_FROM_EMAIL manquant)");
    return;
  }

  await connectDB();
  const branding = await resolveLowStockMailBranding();
  if (!branding) return;

  const { attachments, logoSrc, lineImageSrcs } = await buildInlineImages(branding, ctx.lines);

  const from = `${branding.fromDisplayName} <${fromEmail}>`;
  const subject = buildBatchSubject(branding, ctx);
  const sentAt = new Date();
  const html = buildLowStockBatchEmailHtml(branding, ctx, sentAt, logoSrc, lineImageSrcs);
  const text = buildLowStockBatchEmailText(branding, ctx, sentAt);

  const { error } = await resend.emails.send({
    from,
    to: branding.to,
    subject,
    html,
    text,
    ...(attachments.length > 0 ? { attachments } : {}),
  });
  if (error) {
    console.error("[stock-alerts] Resend:", error);
  }
}

/**
 * Après clôture d’une vente : un seul email listant tous les produits dont le stock est sous le seuil (paramètre) après la vente.
 */
export async function notifyLowStockAfterCompletedSale(input: {
  saleId: string;
  lines: LowStockSaleLineInput[];
}): Promise<void> {
  await connectDB();
  const settings = await AppSetting.findOne({ key: GLOBAL_SETTINGS_KEY })
    .select("lowStockAlertThreshold")
    .lean();
  const lowStockAlertThreshold = normalizeLowStockAlertThreshold(
    settings?.lowStockAlertThreshold
  );

  const resolved: LowStockLineResolved[] = input.lines
    .map((l) => ({
      productName: l.productName,
      productCategory: (l.productCategory ?? "").trim(),
      productImagePublicPath:
        typeof l.productImage === "string" && isSafeProductImagePath(l.productImage)
          ? l.productImage
          : "",
      stockBeforeSale: l.stockBeforeSale,
      stockAfterSale: l.stockAfterSale,
      quantitySold: l.quantitySold,
    }))
    .filter((l) => l.stockAfterSale <= lowStockAlertThreshold);

  if (resolved.length === 0) return;

  await sendResendLowStockBatch({
    saleTicketNumber: saleTicketDisplayId(input.saleId),
    lowStockAlertThreshold,
    lines: resolved,
  }).catch((e) => console.error("[stock-alerts] email", e));
}
