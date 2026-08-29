"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, formatSalePaymentLabel } from "@/lib/utils";
import { exportElementToPdf } from "@/lib/receipt-pdf";
import type { IKitchenOrder } from "@/types";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_LOGO_URL, DEFAULT_SOLUTION_NAME, SALE_CHANGE_PICKUP_DEADLINE_DAYS } from "@/lib/app-settings";
import { saleTicketDisplayId } from "@/lib/sale-ticket-id";

const VENUE_LINE = "Cuisine";

async function fetchBranding(): Promise<{ logoUrl: string; solutionName: string }> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("settings");
  return res.json();
}

export function KitchenReceiptPreview({ order }: { order: IKitchenOrder }) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);

  const { data: branding } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchBranding,
    staleTime: 5 * 60 * 1000,
  });

  const logoUrl = !logoBroken && branding?.logoUrl ? branding.logoUrl : DEFAULT_LOGO_URL;
  const solutionName = branding?.solutionName?.trim() ? branding.solutionName : DEFAULT_SOLUTION_NAME;

  useEffect(() => {
    if (branding?.logoUrl) setLogoBroken(false);
  }, [branding?.logoUrl]);

  const cook = order.cook as { firstName?: string; lastName?: string };
  const plate = order.plate as { number?: string };
  const cookLabel = [cook?.firstName, cook?.lastName].filter(Boolean).join(" ") || "—";
  const plateLabel = plate?.number ? `Plaquette ${plate.number}` : "—";

  const handleDownloadPdf = async () => {
    const el = receiptRef.current;
    if (!el) {
      toast({ variant: "destructive", title: "Erreur", description: "Aperçu du ticket introuvable." });
      return;
    }
    setPdfLoading(true);
    try {
      await exportElementToPdf(el, `ticket-cuisine-${saleTicketDisplayId(order._id)}`);
      toast({ title: "Téléchargement", description: "Le ticket a été enregistré au format PDF." });
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de générer le PDF." });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="sale-receipt-aside w-full">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Aperçu ticket</span>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-[#E5E5E5] bg-white shadow-sm text-[#0D0D0D] hover:bg-[#F5F5F5]"
            onClick={() => window.print()}
            title="Imprimer le ticket"
            aria-label="Imprimer le ticket"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-[#E5E5E5] bg-white shadow-sm text-[#0D0D0D] hover:bg-[#F5F5F5] disabled:opacity-60"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            title="Télécharger le ticket (PDF)"
            aria-label="Télécharger le ticket en PDF"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        ref={receiptRef}
        id="kitchen-receipt-print"
        className="mx-auto w-full max-w-[300px] rounded-sm border border-[#D4D0C8] bg-[#FFFCF7] px-4 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]"
        style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Segoe UI Mono", Consolas, monospace' }}
      >
        <div className="text-center">
          <div className="mx-auto mb-2 flex min-h-[48px] items-center justify-center">
            <img
              src={logoUrl}
              alt=""
              className="max-h-[52px] w-auto max-w-[200px] object-contain object-center"
              onError={() => setLogoBroken(true)}
            />
          </div>
          <p className="text-[14px] font-extrabold leading-tight text-[#0D0D0D]">{solutionName}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">{VENUE_LINE}</p>
        </div>

        <div className="my-3 border-t border-dashed border-[#0D0D0D]/35" />

        <div className="space-y-1 text-[10px] text-[#374151]">
          <div className="flex justify-between gap-2">
            <span className="text-[#6B7280]">Date</span>
            <span className="text-right font-medium text-[#111]">{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#6B7280]">N° ticket</span>
            <span className="font-semibold tracking-wide text-[#111]">{saleTicketDisplayId(order._id)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#6B7280]">Plaquette</span>
            <span className="font-medium text-[#111] text-right">{plateLabel}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#6B7280]">Cuisinière</span>
            <span className="text-right font-medium text-[#111]">{cookLabel}</span>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-[#0D0D0D]/35" />

        <ul className="space-y-2.5">
          {order.items.map((item, idx) => {
            const menu = item.menu as { name?: string };
            const name = menu?.name ?? "Menu";
            return (
              <li key={idx} className="text-[11px] leading-snug">
                <p className="font-semibold text-[#0D0D0D]">{name}</p>
                <div className="mt-0.5 flex justify-between gap-2 text-[10px] text-[#4B5563]">
                  <span>
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-[#111]">{formatCurrency(item.total)}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="my-3 border-t border-dashed border-[#0D0D0D]/35" />

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between font-bold text-[#0D0D0D]">
            <span className="tracking-wide">TOTAL</span>
            <span className="tabular-nums text-[13px]">{formatCurrency(order.totalAmount)}</span>
          </div>

          {order.status === "COMPLETED" && order.amountPaid !== undefined && (
            <>
              {order.paymentMethod != null && (
                <div className="flex justify-between text-[10px] text-[#4B5563]">
                  <span>Paiement</span>
                  <span className="font-medium text-[#111]">{formatSalePaymentLabel(order.paymentMethod)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-[#4B5563]">
                <span>Montant remis</span>
                <span className="tabular-nums font-medium text-[#111]">{formatCurrency(order.amountPaid)}</span>
              </div>
              {order.change !== undefined && order.change > 0 && order.changeReturnedAck !== false && (
                <div className="flex justify-between border-t border-dashed border-[#0D0D0D]/20 pt-2 text-[11px] font-bold text-green-800">
                  <span>Monnaie rendue</span>
                  <span className="tabular-nums">{formatCurrency(order.change)}</span>
                </div>
              )}
              {order.change !== undefined && order.change > 0 && order.changeReturnedAck === false && (
                <>
                  <div className="flex justify-between border-t border-dashed border-[#0D0D0D]/20 pt-2 text-[11px] font-bold text-amber-950">
                    <span>Reliquat à rendre</span>
                    <span className="tabular-nums">{formatCurrency(order.change)}</span>
                  </div>
                  <div className="mt-2 rounded border border-amber-800/40 bg-amber-50 px-2 py-2 text-left text-[8.5px] font-medium leading-snug text-amber-950">
                    <p className="mb-1 font-extrabold uppercase tracking-wide">Reliquat non encore perçu</p>
                    <p>
                      La monnaie ci-dessus n&apos;a pas encore été remise. Le client dispose de{" "}
                      <span className="font-extrabold">{SALE_CHANGE_PICKUP_DEADLINE_DAYS}</span> jour
                      {SALE_CHANGE_PICKUP_DEADLINE_DAYS > 1 ? "s" : ""} calendaire
                      {SALE_CHANGE_PICKUP_DEADLINE_DAYS > 1 ? "s" : ""} pour la récupérer. Passé ce délai, le reliquat
                      n&apos;est plus remboursable.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {order.status === "PENDING" && (
            <p className="pt-1 text-center text-[10px] font-medium text-amber-800">
              Commande en attente — ticket provisoire
            </p>
          )}
        </div>

        <p className="mt-5 border-t border-dashed border-[#0D0D0D]/35 pt-3 text-center text-[9px] leading-relaxed text-[#6B7280]">
          Merci de votre visite
        </p>
      </div>
    </div>
  );
}
