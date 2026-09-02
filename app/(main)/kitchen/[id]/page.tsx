"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Calendar, Receipt, Banknote, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime, formatSalePaymentLabel } from "@/lib/utils";
import type { IKitchenOrder } from "@/types";
import { ProductThumb } from "@/components/sales/ProductThumb";
import { CloseKitchenOrderDialog } from "@/components/kitchen/CloseKitchenOrderDialog";
import { KitchenReceiptPreview } from "@/components/kitchen/KitchenReceiptPreview";
import { toast } from "@/hooks/use-toast";
import { SALE_CHANGE_PICKUP_DEADLINE_DAYS } from "@/lib/app-settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function KitchenOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [orderForClose, setOrderForClose] = useState<IKitchenOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<IKitchenOrder | null>(null);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["kitchen-order", id],
    queryFn: async () => {
      const res = await fetch(`/api/kitchen-orders/${id}`);
      if (!res.ok) throw new Error("fetch");
      return res.json() as Promise<IKitchenOrder>;
    },
    enabled: Boolean(id),
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/kitchen-orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Impossible d'annuler");
      }
    },
    onSuccess: async () => {
      toast({ variant: "success", title: "Commande annulée" });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["kitchen-orders"] }),
        qc.invalidateQueries({ queryKey: ["kitchen-order", id] }),
        qc.invalidateQueries({ queryKey: ["kitchen-plates"] }),
      ]);
      setOrderToCancel(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-8 pb-10 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#6B7280] mb-4">Commande introuvable.</p>
        <Button asChild variant="outline">
          <Link href="/kitchen">Retour à la cuisine</Link>
        </Button>
      </div>
    );
  }

  const cook = order.cook as { firstName: string; lastName: string; photo?: string };
  const kitchenWaitress = order.kitchenWaitress as { firstName: string; lastName: string };
  const plate = order.plate as { number: string };
  const serviceName = kitchenWaitress?.firstName
    ? `${kitchenWaitress.firstName} ${kitchenWaitress.lastName}`
    : `${cook?.firstName ?? ""} ${cook?.lastName ?? ""}`.trim();
  const createdBy = order.createdBy as { firstName?: string; lastName?: string };
  const canCancel = session?.user?.role !== "gerant";

  return (
    <>
      <div className="flex w-full flex-col pb-10 xl:flex-row xl:items-start xl:gap-10">
        <div className="min-w-0 flex-1">
          <div className="max-w-3xl">
            <Link href="/kitchen" className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D0D0D]">
              <ArrowLeft className="h-4 w-4" />
              Retour à la cuisine
            </Link>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold">Détail de la commande</h1>
                  <Badge
                    variant={
                      order.status === "COMPLETED" ? "success" : order.status === "CANCELLED" ? "destructive" : "pending"
                    }
                  >
                    {order.status === "COMPLETED" ? "Clôturée" : order.status === "CANCELLED" ? "Annulée" : "En attente"}
                  </Badge>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                  <Calendar className="h-4 w-4" />
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              {order.status === "PENDING" && (
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/kitchen/${id}/edit`}>Modifier</Link>
                  </Button>
                  <Button onClick={() => setOrderForClose(order)}>Clôturer</Button>
                  {canCancel ? (
                    <Button variant="outline" className="text-red-600" onClick={() => setOrderToCancel(order)}>
                      Annuler
                    </Button>
                  ) : null}
                </div>
              )}
            </div>

            <div className="grid gap-6">
              <Card className="border-[#E5E5E5]">
                <CardHeader>
                  <CardTitle className="text-base">Service cuisine</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5F5F5]">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Serveuse-cuisinière</p>
                        <p className="font-medium">{serviceName || "—"}</p>
                      </div>
                    </div>
                    <div className="hidden h-10 w-px shrink-0 bg-[#E5E5E5] sm:block" />
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Plaquette</p>
                        <p className="font-medium">{plate?.number ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                  {(createdBy?.firstName || createdBy?.lastName) && (
                    <p className="text-xs text-[#9CA3AF] pt-2 border-t border-[#F5F5F5]">
                      Enregistré par {createdBy.firstName} {createdBy.lastName}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-[#E5E5E5]">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Menus
                  </CardTitle>
                  <CardDescription>{order.items.length} ligne{order.items.length !== 1 ? "s" : ""}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-[#F5F5F5]">
                    {order.items.map((item, idx) => {
                      const menu = item.menu as { name?: string; image?: string };
                      const name = menu?.name ?? "Menu";
                      return (
                        <li key={idx} className="flex items-center gap-4 px-6 py-4">
                          <ProductThumb imageUrl={menu?.image} name={name} sizeClass="h-14 w-14" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{name}</p>
                            <p className="text-xs text-[#6B7280]">
                              {formatCurrency(item.unitPrice)} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold shrink-0">{formatCurrency(item.total)}</p>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex items-center justify-between px-6 py-4 bg-[#FAFAFA] border-t border-[#E5E5E5]">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </CardContent>
              </Card>

              {order.status === "COMPLETED" && order.amountPaid !== undefined && (
                <Card className="border-[#E5E5E5]">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Paiement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">Mode de paiement</span>
                      <span className="font-medium">{formatSalePaymentLabel(order.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">Montant remis</span>
                      <span className="font-medium">{formatCurrency(order.amountPaid)}</span>
                    </div>
                    {order.change !== undefined && order.change > 0 && order.changeReturnedAck !== false && (
                      <div className="flex justify-between items-center rounded-lg bg-green-50 px-4 py-3">
                        <span className="text-sm font-medium text-green-900 flex items-center gap-2">
                          <Coins className="w-4 h-4" />
                          Monnaie rendue
                        </span>
                        <span className="font-bold text-green-800">{formatCurrency(order.change)}</span>
                      </div>
                    )}
                    {order.change !== undefined && order.change > 0 && order.changeReturnedAck === false && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        Reliquat à rendre : {formatCurrency(order.change)}. Délai de {SALE_CHANGE_PICKUP_DEADLINE_DAYS} jour
                        {SALE_CHANGE_PICKUP_DEADLINE_DAYS > 1 ? "s" : ""}.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        <aside className="mt-10 w-full shrink-0 xl:mt-0 xl:w-[min(100%,340px)] xl:sticky xl:top-6">
          <KitchenReceiptPreview order={order} />
        </aside>
      </div>

      <CloseKitchenOrderDialog order={orderForClose} onClose={() => setOrderForClose(null)} />
      <Dialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Annuler cette commande ?</DialogTitle>
            <DialogDescription>Elle restera visible avec le statut Annulée.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOrderToCancel(null)}>Retour</Button>
            <Button variant="destructive" disabled={cancelOrder.isPending} onClick={() => orderToCancel?._id && cancelOrder.mutate(orderToCancel._id)}>
              {cancelOrder.isPending ? "Annulation..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
