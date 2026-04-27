/**
 * Le prix de vente unitaire marché doit toujours être strictement supérieur au prix catalogue SOBEBRA.
 */
export function marketPriceAboveCatalogError(sobebra: number, market: number): string | null {
  if (!Number.isFinite(sobebra) || !Number.isFinite(market)) {
    return "Prix invalide";
  }
  if (market <= sobebra) {
    return "Le prix de vente marché doit être strictement supérieur au prix SOBEBRA";
  }
  return null;
}

/** Corps JSON / formulaire : nombre valide, ou absent / vide → null (pas 0 par défaut côté client). */
export function parsePriceBodyField(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Création / import : le prix marché est requis. Si le SOBEBRA est absent (null) ou laissé à 0 alors que
 * le marché est strictement supérieur à 1, on le déduit pour respecter marché > SOBEBRA (par défaut : marché − 1, plancher 0).
 * Un SOBEBRA à 0 avec marché = 1 reste un 0 explicite valide.
 */
export function resolveCatalogPriceForImport(
  sellingPrice: number | null | undefined,
  market: number | null | undefined
): { sellingPrice: number; defaultMarketSellingPrice: number } | null {
  const m = market;
  if (m == null || !Number.isFinite(m) || m <= 0) return null;

  const s = sellingPrice;
  const explicitSobe =
    s != null &&
    Number.isFinite(s) &&
    s >= 0 &&
    (s > 0 || (s === 0 && m <= 1));

  if (explicitSobe && s != null) {
    if (m <= s) return null;
    return { sellingPrice: s, defaultMarketSellingPrice: m };
  }

  const inferred = Math.max(0, m - 1);
  if (m <= inferred) return null;
  return { sellingPrice: inferred, defaultMarketSellingPrice: m };
}
