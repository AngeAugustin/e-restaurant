"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Phone, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { formatSaleTablesLine } from "@/lib/sale-tables";
import type { ISale, IWaitress } from "@/types";

async function fetchWaitress(id: string): Promise<IWaitress> {
  const res = await fetch(`/api/waitresses/${id}`);
  if (!res.ok) throw new Error("waitress");
  return res.json();
}

async function fetchWaitressSales(id: string): Promise<ISale[]> {
  const res = await fetch(`/api/waitresses/${id}/sales`);
  if (!res.ok) throw new Error("sales");
  return res.json();
}

export default function WaitressDetailPage() {
  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);

  const { data: waitress, isLoading: waitressLoading } = useQuery({
    queryKey: ["waitress", id],
    queryFn: () => fetchWaitress(id),
    enabled: Boolean(id),
  });

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["waitress-sales", id],
    queryFn: () => fetchWaitressSales(id),
    enabled: Boolean(id),
  });

  const totalSales = sales?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalSales / pageSize));
  const paginatedSales = (sales ?? []).slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalRevenue = sales?.filter((s) => s.status === "COMPLETED").reduce((sum, s) => sum + s.totalAmount, 0) ?? 0;
  const completedSales = sales?.filter((s) => s.status === "COMPLETED").length ?? 0;
  const pendingSales = sales?.filter((s) => s.status === "PENDING").length ?? 0;
  const cancelledSales = sales?.filter((s) => s.status === "CANCELLED").length ?? 0;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  return (
    <div>
      <Link
        href="/waitresses"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B7280] transition-colors hover:text-[#0D0D0D]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux serveuses
      </Link>

      {waitressLoading ? (
        <Skeleton className="mb-6 h-24 rounded-xl" />
      ) : waitress ? (
        <div className="mb-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-[#0D0D0D]">Détail de la serveuse</h1>
                <Badge variant="secondary" className="rounded-full">
                  Profil
                </Badge>
              </div>
              <p className="mt-2 text-sm text-[#6B7280]">
                Suivi des ventes servies par {waitress.firstName} {waitress.lastName}
              </p>
            </div>
          </div>

        </div>
      ) : null}

      <div className="flex w-full flex-col pb-10 xl:flex-row xl:items-start xl:gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex justify-end">
            <label className="inline-flex items-center gap-2 text-xs text-[#6B7280]">
              Lignes par page
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
                className="h-8 rounded-md border border-[#E5E7EB] bg-white px-2 text-xs text-[#0D0D0D] outline-none transition-colors focus:border-[#0D0D0D]"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Card className="border-[#E5E5E5]">
            <CardHeader>
              <CardTitle className="text-base">Historique des ventes servies</CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : !sales?.length ? (
                <p className="py-10 text-center text-[#9CA3AF]">Aucune vente liée à cette serveuse.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F5F5F5]">
                        <th className="px-3 py-3 text-left text-xs font-medium text-[#9CA3AF]">Date</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-[#9CA3AF]">Tables</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-[#9CA3AF]">Articles</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-[#9CA3AF]">Total</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-[#9CA3AF]">Statut</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-[#9CA3AF]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSales.map((sale) => (
                        <tr key={sale._id} className="border-b border-[#FAFAFA] transition-colors hover:bg-[#FAFAFA]">
                          <td className="px-3 py-3.5 text-[#6B7280]">{formatDateTime(sale.createdAt)}</td>
                          <td
                            className="max-w-[200px] truncate px-3 py-3.5 font-medium text-[#0D0D0D]"
                            title={formatSaleTablesLine(sale)}
                          >
                            {formatSaleTablesLine(sale)}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <Badge variant="secondary">
                              {sale.items.length} article{sale.items.length > 1 ? "s" : ""}
                            </Badge>
                          </td>
                          <td className="px-3 py-3.5 text-right font-semibold text-[#0D0D0D]">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <Badge
                              variant={
                                sale.status === "COMPLETED"
                                  ? "success"
                                  : sale.status === "CANCELLED"
                                    ? "destructive"
                                    : "pending"
                              }
                            >
                              {sale.status === "COMPLETED"
                                ? "Cloturee"
                                : sale.status === "CANCELLED"
                                  ? "Annulee"
                                  : "En attente"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/sales/${sale._id}`}>
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                Details
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          <PaginationControls
            className="mt-6"
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalSales}
            onPageChange={setCurrentPage}
          />
        </div>

        <aside className="mt-6 w-full shrink-0 space-y-4 xl:mt-0 xl:w-[min(100%,320px)] xl:sticky xl:top-6">
          <Card className="border-[#E5E5E5]">
            <CardHeader>
              <CardTitle className="text-base">Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {waitressLoading ? (
                <Skeleton className="h-20 rounded-lg" />
              ) : waitress ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 xl:flex-col xl:items-stretch">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5F5F5]">
                        <UserRound className="h-4 w-4 text-[#0D0D0D]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[#9CA3AF]">Serveuse</p>
                        <p className="truncate font-medium text-[#0D0D0D]">
                          {waitress.firstName} {waitress.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="hidden h-10 w-px shrink-0 bg-[#E5E5E5] sm:block xl:hidden" />
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5F5F5]">
                        <Phone className="h-4 w-4 text-[#0D0D0D]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-[#9CA3AF]">Téléphone</p>
                        <p className="truncate font-medium text-[#0D0D0D]">
                          {waitress.phone?.trim() ? waitress.phone : "Pas de téléphone"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="border-t border-[#F5F5F5] pt-2 text-xs text-[#9CA3AF]">
                    Enregistrée depuis {formatDate(waitress.createdAt)}
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-[#E5E5E5]">
            <CardHeader>
              <CardTitle className="text-base">Résumé d'activité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {salesLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">Ventes totales</p>
                    <p className="mt-1 text-xl font-semibold text-[#0D0D0D]">{totalSales}</p>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">CA clôturé</p>
                    <p className="mt-1 text-xl font-semibold text-[#0D0D0D]">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">Clôturées</p>
                    <p className="mt-1 text-xl font-semibold text-[#0D0D0D]">{completedSales}</p>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-[#9CA3AF]">En attente / Annulées</p>
                    <p className="mt-1 text-xl font-semibold text-[#0D0D0D]">
                      {pendingSales} / {cancelledSales}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
