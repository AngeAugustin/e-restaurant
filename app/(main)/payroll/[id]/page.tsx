"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PayrollSlipPreview } from "@/components/payroll/PayrollSlipPreview";
import { PAYROLL_TYPE_LABEL } from "@/lib/payroll";
import type { IPayroll } from "@/types";

function personName(p: IPayroll): string {
  const n = (o?: { firstName?: string; lastName?: string } | string) =>
    typeof o === "object" && o ? `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim() : "";
  if (p.beneficiaryType === "WAITRESS") return n(p.waitress as { firstName?: string; lastName?: string }) || "—";
  if (p.beneficiaryType === "COOK") return n(p.cook as { firstName?: string; lastName?: string }) || "—";
  return n(p.user as { firstName?: string; lastName?: string }) || "—";
}

export default function PayrollSlipPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const can = ["directeur", "directrice"].includes(session?.user?.role ?? "");

  const { data: payroll, isLoading, isError } = useQuery({
    queryKey: ["payroll", id],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/${id}`);
      if (!res.ok) throw new Error("fetch");
      return res.json() as Promise<IPayroll>;
    },
    enabled: Boolean(id) && can,
  });

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
        <PayrollSlipPreview payroll={payroll} />
      </div>
    </div>
  );
}
