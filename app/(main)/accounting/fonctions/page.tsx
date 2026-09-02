"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountingJobTitlesPanel } from "@/components/accounting/AccountingJobTitlesPanel";

export default function AccountingFonctionsPage() {
  const { data: session, status } = useSession();
  const can = ["directeur", "directrice"].includes(session?.user?.role ?? "");

  if (status === "loading") return <Skeleton className="h-96" />;
  if (!can) return <p className="py-20 text-center text-[#9CA3AF]">Accès réservé à la direction.</p>;

  return (
    <div>
      <PageHeader
        title="Fonctions"
        subtitle="Salaires de référence par type de personnel pour les fiches de paie"
      />
      <AccountingJobTitlesPanel />
    </div>
  );
}
