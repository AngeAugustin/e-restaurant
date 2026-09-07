"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Loader2, Search, ShieldAlert, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { formatSaleTablesLine } from "@/lib/sale-tables";
import { isValidTicketQuery, normalizeTicketInput } from "@/lib/sale-ticket-id";
import type { IKitchenOrder, ISale } from "@/types";

type TicketModule = "bar" | "cuisine";

type VerifyResult =
  | { ok: true; ticket: string; sale: ISale }
  | { ok: true; ticket: string; order: IKitchenOrder }
  | { ok: false; message: string };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  COMPLETED: "Clôturée",
  CANCELLED: "Annulée",
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
};

function personName(p?: { firstName?: string; lastName?: string } | string | null): string {
  if (!p || typeof p === "string") return "—";
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—";
}

function statusClass(status: string): string {
  if (status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "CANCELLED") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function VerifyTicketDialog({
  open,
  onOpenChange,
  module,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: TicketModule;
}) {
  const [ticketInput, setTicketInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const endpoint =
    module === "bar" ? "/api/sales/by-ticket" : "/api/kitchen-orders/by-ticket";
  const detailHref = (id: string) => (module === "bar" ? `/sales/${id}` : `/kitchen/${id}`);
  const moduleLabel = module === "bar" ? "vente bar" : "commande cuisine";

  const reset = () => {
    setTicketInput("");
    setResult(null);
    setLoading(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const verify = async (e?: FormEvent) => {
    e?.preventDefault();
    const ticket = normalizeTicketInput(ticketInput);
    if (!isValidTicketQuery(ticket)) {
      setResult({
        ok: false,
        message: "Saisissez les 10 caractères du N° ticket (ou l’identifiant complet).",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${endpoint}?ticket=${encodeURIComponent(ticket)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({
          ok: false,
          message: typeof data.error === "string" ? data.error : "Ticket introuvable ou non authentique.",
        });
        return;
      }
      if (module === "bar" && data.sale) {
        setResult({ ok: true, ticket: data.ticket, sale: data.sale as ISale });
      } else if (module === "cuisine" && data.order) {
        setResult({ ok: true, ticket: data.ticket, order: data.order as IKitchenOrder });
      } else {
        setResult({ ok: false, message: "Réponse invalide du serveur." });
      }
    } catch {
      setResult({ ok: false, message: "Impossible de vérifier le ticket pour le moment." });
    } finally {
      setLoading(false);
    }
  };

  const sale = result?.ok && "sale" in result ? result.sale : null;
  const order = result?.ok && "order" in result ? result.order : null;
  const doc = sale ?? order;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vérifier un ticket</DialogTitle>
          <DialogDescription>
            Saisissez le N° ticket imprimé pour contrôler l’authenticité d’une {moduleLabel} et afficher ses détails.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={verify} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="verify-ticket-input">N° ticket</Label>
            <div className="flex gap-2">
              <Input
                id="verify-ticket-input"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Ex. A1B2C3D4E5"
                className="font-mono uppercase tracking-wider"
                autoComplete="off"
                autoFocus
              />
              <Button type="submit" disabled={loading} className="shrink-0 gap-1.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Vérifier
              </Button>
            </div>
          </div>
        </form>

        {result && !result.ok ? (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <ShieldX className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Ticket non authentique</p>
              <p className="mt-0.5 text-rose-800/90">{result.message}</p>
            </div>
          </div>
        ) : null}

        {result?.ok && doc ? (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800">
                <BadgeCheck className="h-3.5 w-3.5" />
                Ticket authentique
              </span>
              <span className="font-mono text-sm font-semibold tracking-wider text-slate-900">
                {result.ticket}
              </span>
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(doc.status)}`}
              >
                {STATUS_LABEL[doc.status] ?? doc.status}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Date</dt>
                <dd className="font-medium text-slate-900">{formatDateTime(doc.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Total</dt>
                <dd className="font-semibold text-slate-900">{formatCurrency(doc.totalAmount)}</dd>
              </div>
              {sale ? (
                <>
                  <div>
                    <dt className="text-xs text-slate-500">Tables</dt>
                    <dd className="font-medium text-slate-900">{formatSaleTablesLine(sale)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Serveuse</dt>
                    <dd className="font-medium text-slate-900">{personName(sale.waitress as { firstName?: string; lastName?: string })}</dd>
                  </div>
                </>
              ) : null}
              {order ? (
                <>
                  <div>
                    <dt className="text-xs text-slate-500">Plaquette</dt>
                    <dd className="font-medium text-slate-900">
                      {typeof order.plate === "object" && order.plate && "number" in order.plate
                        ? `N° ${order.plate.number}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Serveuse-cuisinière</dt>
                    <dd className="font-medium text-slate-900">
                      {personName(order.kitchenWaitress as { firstName?: string; lastName?: string })}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-500">Cuisinière</dt>
                    <dd className="font-medium text-slate-900">
                      {personName(order.cook as { firstName?: string; lastName?: string })}
                    </dd>
                  </div>
                </>
              ) : null}
              {doc.status === "COMPLETED" && doc.paymentMethod ? (
                <div>
                  <dt className="text-xs text-slate-500">Paiement</dt>
                  <dd className="font-medium text-slate-900">
                    {PAYMENT_LABEL[doc.paymentMethod] ?? doc.paymentMethod}
                    {doc.amountPaid != null ? ` · ${formatCurrency(doc.amountPaid)}` : null}
                  </dd>
                </div>
              ) : null}
              <div className={doc.status === "COMPLETED" && doc.paymentMethod ? "" : "col-span-2"}>
                <dt className="text-xs text-slate-500">Articles</dt>
                <dd className="font-medium text-slate-900">
                  {doc.items.length} article{doc.items.length > 1 ? "s" : ""}
                </dd>
              </div>
            </dl>

            <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs text-slate-700">
              {sale
                ? sale.items.map((item, i) => {
                    const product = item.product as { name?: string } | string;
                    const name = typeof product === "object" ? product?.name ?? "Article" : "Article";
                    return (
                      <li key={`${sale._id}-${i}`} className="flex justify-between gap-2">
                        <span className="truncate">
                          {item.quantity}× {name}
                        </span>
                        <span className="shrink-0 tabular-nums">{formatCurrency(item.total)}</span>
                      </li>
                    );
                  })
                : null}
              {order
                ? order.items.map((item, i) => {
                    const menu = item.menu as { name?: string } | string;
                    const name = typeof menu === "object" ? menu?.name ?? "Menu" : "Menu";
                    return (
                      <li key={`${order._id}-${i}`} className="flex justify-between gap-2">
                        <span className="truncate">
                          {item.quantity}× {name}
                        </span>
                        <span className="shrink-0 tabular-nums">{formatCurrency(item.total)}</span>
                      </li>
                    );
                  })
                : null}
            </ul>

            {doc.status === "CANCELLED" ? (
              <p className="flex items-center gap-1.5 text-xs text-rose-700">
                <ShieldAlert className="h-3.5 w-3.5" />
                Attention : ce ticket correspond à une commande annulée.
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Fermer
          </Button>
          {result?.ok && doc ? (
            <Button asChild>
              <Link href={detailHref(doc._id)} onClick={() => handleOpenChange(false)}>
                Voir le détail
              </Link>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
