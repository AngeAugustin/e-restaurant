"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpensePaymentMethodsPanel } from "@/components/accounting/ExpensePaymentMethodsPanel";

export default function AccountingPaymentMethodsPage() {
  const { data: session, status } = useSession();
  const can = ["directeur", "directrice", "gerant"].includes(session?.user?.role ?? "");

  if (status === "loading") return <Skeleton className="h-96" />;
  if (!can) return <p className="py-20 text-center text-[#9CA3AF]">Accès refusé.</p>;

  return (
    <div>
      <PageHeader title="Modes de paiement" subtitle="Modes de paiement proposés lors de l'enregistrement d'une dépense" />
      <ExpensePaymentMethodsPanel />
    </div>
  );
}
