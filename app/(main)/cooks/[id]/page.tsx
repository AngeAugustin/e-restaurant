"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ProductThumb } from "@/components/sales/ProductThumb";
import type { ICook, IKitchenOrder } from "@/types";

export default function CookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data: cook, isLoading } = useQuery({
    queryKey: ["cook", id],
    queryFn: async () => {
      const res = await fetch(`/api/cooks/${id}`);
      if (!res.ok) throw new Error("cook");
      return res.json() as Promise<ICook>;
    },
    enabled: Boolean(id),
  });
  const { data: orders } = useQuery({
    queryKey: ["cook-orders", id],
    queryFn: async () => (await fetch(`/api/cooks/${id}/orders`)).json() as Promise<IKitchenOrder[]>,
    enabled: Boolean(id),
  });

  const total = orders?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rows = (orders ?? []).slice((page - 1) * pageSize, page * pageSize);
  const revenue = orders?.filter((o) => o.status === "COMPLETED").reduce((s, o) => s + o.totalAmount, 0) ?? 0;
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <div>
      <Link href="/cooks" className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B7280]">
        <ArrowLeft className="h-4 w-4" /> Retour aux cuisinières
      </Link>
      {isLoading ? <Skeleton className="mb-6 h-24" /> : cook ? (
        <div className="mb-6 flex items-start gap-4">
          {cook.photo ? <ProductThumb imageUrl={cook.photo} name={cook.firstName} sizeClass="h-16 w-16" /> : null}
          <div>
            <h1 className="text-2xl font-semibold">{cook.firstName} {cook.lastName}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-[#6B7280]"><Phone className="h-4 w-4" />{cook.phone}</p>
            {cook.diploma && <Badge variant="secondary" className="mt-2">{cook.diploma}</Badge>}
            <p className="mt-2 text-sm">CA clôturé : {formatCurrency(revenue)}</p>
          </div>
        </div>
      ) : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-slate-500">
            <th className="py-2">Date</th>
            <th>Plaquette</th>
            <th>Total</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const plate = o.plate as { number?: string };
            return (
              <tr key={o._id} className="border-b">
                <td className="py-2">{formatDateTime(o.createdAt)}</td>
                <td>{plate?.number ?? "—"}</td>
                <td>{formatCurrency(o.totalAmount)}</td>
                <td>{o.status === "COMPLETED" ? "Clôturée" : o.status === "CANCELLED" ? "Annulée" : "En attente"}</td>
                <td><Button size="sm" variant="outline" asChild><Link href={`/kitchen/${o._id}`}>Détail</Link></Button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <PaginationControls className="mt-6" currentPage={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} />
    </div>
  );
}
