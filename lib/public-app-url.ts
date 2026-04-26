/**
 * URL publique de l’app (emails, liens absolus). Préférer NEXTAUTH_URL ou NEXT_PUBLIC_APP_URL.
 */
export function getPublicAppBaseUrl(): string {
  const explicit =
    process.env.NEXTAUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    const host = v.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  const p = pathOrUrl.trim();
  if (!p) return getPublicAppBaseUrl();
  if (/^https?:\/\//i.test(p)) return p;
  const base = getPublicAppBaseUrl();
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}
