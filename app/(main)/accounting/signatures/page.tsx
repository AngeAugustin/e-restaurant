"use client";

import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { SignaturesPanel } from "@/components/accounting/SignaturesPanel";

export default function AccountingSignaturesPage() {
  const { data: session, status } = useSession();
  const can = ["directeur", "directrice"].includes(session?.user?.role ?? "");

  if (status === "loading") return <Skeleton className="h-96" />;
  if (!can) return <p className="py-20 text-center text-[#9CA3AF]">Accès réservé à la direction.</p>;

  return (
    <div>
      <PageHeader
        title="Signatures"
        subtitle="Signatures des Directeurs et Directrices utilisées comme promoteur sur les fiches de paie"
      />
      <SignaturesPanel />
    </div>
  );
}
