"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PayrollSlipPreview } from "@/components/payroll/PayrollSlipPreview";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { PAYROLL_TYPE_LABEL } from "@/lib/payroll";
import type { IPayroll } from "@/types";

function personName(p: IPayroll): string {
  const n = (o?: { firstName?: string; lastName?: string } | string) =>
    typeof o === "object" && o ? `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim() : "";
  if (p.beneficiaryType === "WAITRESS") return n(p.waitress as { firstName?: string; lastName?: string }) || "—";
  if (p.beneficiaryType === "KITCHEN_WAITRESS") return n(p.kitchenWaitress as { firstName?: string; lastName?: string }) || "—";
  if (p.beneficiaryType === "COOK") return n(p.cook as { firstName?: string; lastName?: string }) || "—";
  return n(p.user as { firstName?: string; lastName?: string }) || "—";
}

export default function PayrollSlipPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: session, status } = useSession();
  const can = ["directeur", "directrice"].includes(session?.user?.role ?? "");
  const [confirmPay, setConfirmPay] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const { data: payroll, isLoading, isError } = useQuery({
    queryKey: ["payroll", id],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/${id}`);
      if (!res.ok) throw new Error("fetch");
      return res.json() as Promise<IPayroll>;
    },
    enabled: Boolean(id) && can,
  });

  const markPaid = async () => {
    if (!payroll) return;
    setMarkingPaid(true);
    const res = await fetch(`/api/payroll/${payroll._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_paid" }),
    });
    setMarkingPaid(false);
    if (!res.ok) {
      toast({ variant: "destructive", title: "Erreur", description: (await res.json()).error });
      return;
    }
    const updated = (await res.json()) as IPayroll;
    qc.setQueryData(["payroll", id], updated);
    qc.invalidateQueries({ queryKey: ["payroll"] });
    setConfirmPay(false);
    toast({ variant: "success", title: "Fiche marquée comme payée" });
  };

  if (status === "loading") return <Skeleton className="h-96" />;
  if (!can) return <p className="py-20 text-center text-[#9CA3AF]">Accès réservé à la direction.</p>;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mx-auto h-[1100px] w-full max-w-[794px]" />
      </div>
    );
  }

  if (isError || !payroll) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-[#6B7280]">Fiche de paie introuvable.</p>
        <Button asChild variant="outline">
          <Link href="/payroll">Retour à la paie</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <Link
        href="/payroll"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0D0D0D]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la paie
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Aperçu de la fiche de paie</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {personName(payroll)} — {PAYROLL_TYPE_LABEL[payroll.beneficiaryType]}
        </p>
      </div>

      <div className="-mx-4 bg-slate-200/70 px-4 py-8 sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl">
        <PayrollSlipPreview
          payroll={payroll}
          onMarkPaid={!payroll.isPaid ? () => setConfirmPay(true) : undefined}
          markingPaid={markingPaid}
        />
      </div>

      <Dialog open={confirmPay} onOpenChange={(open) => !open && !markingPaid && setConfirmPay(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer le paiement</DialogTitle>
            <DialogDescription>
              Marquer la fiche de {personName(payroll)} ({formatCurrency(payroll.amount)}) comme payée ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmPay(false)} disabled={markingPaid}>
              Annuler
            </Button>
            <Button type="button" onClick={markPaid} disabled={markingPaid}>
              {markingPaid ? "Enregistrement…" : "Payer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
