"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, TruckIcon, ShoppingCart, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ISale } from "@/types";
import { formatSaleTablesLine } from "@/lib/sale-tables";

interface ProductDetail {
  product: {
    _id: string;
    name: string;
    image?: string;
    sellingPrice: number;
    defaultMarketSellingPrice?: number;
    stock: number;
  };
  supplies: Array<{
    _id: string;
    lotSize: number;
    lotPrice: number;
    numberOfLots: number;
    totalUnits: number;
    totalCost: number;
    marketSellingPrice: number;
    createdBy: { firstName: string; lastName: string };
    createdAt: string;
  }>;
  sales: ISale[];
  stock: number;
}

async function fetchProductDetail(id: string): Promise<ProductDetail> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductDetail(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-center py-20 text-[#9CA3AF]">Produit introuvable</p>;

  const { product, supplies, sales } = data;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-[#0D0D0D]">{product.name}</h1>
          <p className="text-sm text-[#6B7280]">Détails du produit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-square bg-[#F5F5F5] rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <ImageIcon className="w-16 h-16 text-[#D1D5DB]" />
                )}
              </div>
              <h2 className="font-semibold text-[#0D0D0D] text-lg">{product.name}</h2>
              <p className="mt-1 text-2xl font-bold text-[#0D0D0D]">
                {formatCurrency(
                  supplies[0]?.marketSellingPrice ??
                    product.defaultMarketSellingPrice ??
                    product.sellingPrice
                )}
              </p>
              <p className="text-sm text-[#6B7280]">
                {supplies[0]
                  ? "Prix vente marché (dernier approvisionnement)"
                  : product.defaultMarketSellingPrice != null
                    ? "Prix vente marché par défaut (fiche produit)"
                    : "Prix catalogue SOBEBRA"}
              </p>
              <p className="mt-2 text-xs text-[#6B7280]">
                Prix SOBEBRA (catalogue) :{" "}
                <span className="font-medium text-[#0D0D0D]">{formatCurrency(product.sellingPrice)}</span>
              </p>
              {product.defaultMarketSellingPrice != null && (
                <p className="mt-1 text-xs text-[#6B7280]">
                  Prix marché par défaut à l&apos;appro :{" "}
                  <span className="font-medium text-[#0D0D0D]">
                    {formatCurrency(product.defaultMarketSellingPrice)}
                  </span>
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B7280]">Stock actuel</span>
                  <Badge
                    variant={
                      product.stock === 0 ? "destructive" : product.stock < 5 ? "warning" : "success"
                    }
                    className="text-sm px-3"
                  >
                    {product.stock} unités
                  </Badge>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-[#F5F5F5] rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-[#0D0D0D]">{supplies.length}</p>
                  <p className="text-xs text-[#6B7280]">Approvisionnements</p>
                </div>
                <div className="bg-[#F5F5F5] rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-[#0D0D0D]">{sales.length}</p>
                  <p className="text-xs text-[#6B7280]">Ventes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supply History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TruckIcon className="w-4 h-4" />
                  Historique des approvisionnements
                  <Badge variant="secondary">{supplies.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supplies.length === 0 ? (
                  <p className="text-sm text-[#9CA3AF] py-4 text-center">
                    Aucun approvisionnement enregistré
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F5F5F5]">
                          <th className="text-left py-2 px-2 text-xs font-medium text-[#9CA3AF]">Date</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-[#9CA3AF]">Lots</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-[#9CA3AF]">Unités</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-[#9CA3AF]">Coût total</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-[#9CA3AF]">Prix vente</th>
                          <th className="text-left py-2 px-2 text-xs font-medium text-[#9CA3AF]">Par</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplies.map((supply) => (
                          <tr key={supply._id} className="border-b border-[#FAFAFA] hover:bg-[#FAFAFA]">
                            <td className="py-2.5 px-2 text-[#374151]">{formatDate(supply.createdAt)}</td>
                            <td className="py-2.5 px-2 text-right text-[#374151]">
                              {supply.numberOfLots} × {supply.lotSize}
                            </td>
                            <td className="py-2.5 px-2 text-right font-medium text-[#0D0D0D]">
                              {supply.totalUnits}
                            </td>
                            <td className="py-2.5 px-2 text-right text-[#374151]">
                              {formatCurrency(supply.totalCost)}
                            </td>
                            <td className="py-2.5 px-2 text-right text-[#374151]">
                              {formatCurrency(supply.marketSellingPrice)}
                            </td>
                            <td className="py-2.5 px-2 text-[#6B7280] text-xs">
                              {supply.createdBy?.firstName} {supply.createdBy?.lastName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sales History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Historique des ventes
                  <Badge variant="secondary">{sales.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <p className="text-sm text-[#9CA3AF] py-4 text-center">
                    Aucune vente enregistrée
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F5F5F5]">
                          <th className="text-left py-2 px-2 text-xs font-medium text-[#9CA3AF]">Date</th>
                          <th className="text-left py-2 px-2 text-xs font-medium text-[#9CA3AF]">Table</th>
                          <th className="text-left py-2 px-2 text-xs font-medium text-[#9CA3AF]">Serveuse</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-[#9CA3AF]">Qté</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-[#9CA3AF]">Total</th>
                          <th className="text-right py-2 px-2 text-xs font-medium text-[#9CA3AF]">Marge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((sale) => {
                          const lineProductId = (line: (typeof sale.items)[0]) => {
                            const raw = line.product;
                            if (typeof raw === "string") return raw;
                            if (raw && typeof raw === "object" && "_id" in raw)
                              return String((raw as { _id: string })._id);
                            return "";
                          };
                          const item = sale.items.find((line) => lineProductId(line) === String(id));
                          const lineMargin =
                            item?.unitCost != null
                              ? (item.total ?? 0) - item.unitCost * (item.quantity ?? 0)
                              : null;
                          const waitress = sale.waitress as { firstName?: string; lastName?: string };
                          return (
                            <tr key={sale._id} className="border-b border-[#FAFAFA] hover:bg-[#FAFAFA]">
                              <td className="py-2.5 px-2 text-[#374151]">{formatDate(sale.createdAt)}</td>
                              <td className="py-2.5 px-2 text-[#374151] max-w-[160px] truncate" title={formatSaleTablesLine(sale)}>
                                {formatSaleTablesLine(sale)}
                              </td>
                              <td className="py-2.5 px-2 text-[#374151]">
                                {waitress?.firstName} {waitress?.lastName}
                              </td>
                              <td className="py-2.5 px-2 text-right font-medium text-[#0D0D0D]">
                                {item?.quantity}
                              </td>
                              <td className="py-2.5 px-2 text-right text-[#374151]">
                                {formatCurrency(item?.total ?? 0)}
                              </td>
                              <td className="py-2.5 px-2 text-right text-[#374151]">
                                {lineMargin != null ? formatCurrency(lineMargin) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
