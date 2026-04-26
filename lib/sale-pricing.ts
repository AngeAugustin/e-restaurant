import Product from "@/models/Product";
import Supply from "@/models/Supply";

export interface SaleLinePricing {
  /** Prix unitaire marché : dernier appro, sinon `defaultMarketSellingPrice`, sinon `sellingPrice` (SOBEBRA) */
  unitPrice: number;
  /** Coût d'achat réel unitaire : `totalCost / totalUnits` du dernier appro, sinon 0 */
  unitCost: number;
}

/**
 * Détermine le prix de vente et le coût unitaire pour une ligne de vente,
 * à partir du dernier document d'approvisionnement pour ce produit.
 */
export async function resolveSaleLinePricing(productId: string): Promise<SaleLinePricing> {
  const latest = await Supply.findOne({ product: productId })
    .sort({ createdAt: -1 })
    .select("marketSellingPrice totalCost totalUnits")
    .lean<{ marketSellingPrice: number; totalCost: number; totalUnits: number } | null>();

  const product = await Product.findById(productId)
    .select("sellingPrice defaultMarketSellingPrice")
    .lean<{ sellingPrice: number; defaultMarketSellingPrice?: number } | null>();

  const fallbackPrice =
    product?.defaultMarketSellingPrice != null && Number.isFinite(product.defaultMarketSellingPrice)
      ? product.defaultMarketSellingPrice
      : (product?.sellingPrice ?? 0);

  if (!latest || !latest.totalUnits || latest.totalUnits <= 0) {
    return { unitPrice: fallbackPrice, unitCost: 0 };
  }

  return {
    unitPrice: latest.marketSellingPrice,
    unitCost: latest.totalCost / latest.totalUnits,
  };
}
