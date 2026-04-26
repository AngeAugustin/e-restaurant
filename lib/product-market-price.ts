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
