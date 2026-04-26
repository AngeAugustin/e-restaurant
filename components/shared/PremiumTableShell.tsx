"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const premiumTableSelectClass =
  "h-8 rounded-lg border border-slate-200/80 bg-white/90 px-2.5 text-xs font-medium text-slate-800 shadow-sm outline-none ring-violet-500/20 transition focus:border-violet-300 focus:ring-2";

type PremiumTableShellProps = {
  title: string;
  isLoading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
  tableMinWidthClass?: string;
  skeletonColSpan?: number;
  /** Affiché sous le message lorsque `empty` est vrai (ex. bouton d’action). */
  emptyAction?: ReactNode;
  children: React.ReactNode;
};

export function PremiumTableShell({
  title,
  isLoading = false,
  empty = false,
  emptyMessage = "Aucune donnée",
  skeletonRows = 6,
  tableMinWidthClass = "min-w-[860px]",
  skeletonColSpan = 8,
  emptyAction,
  children,
}: PremiumTableShellProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.25)] backdrop-blur-sm ring-1 ring-slate-950/[0.04]">
      <div className="relative border-b border-slate-200/60 bg-gradient-to-r from-violet-500/[0.06] via-slate-50/40 to-cyan-500/[0.05] px-6 py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_0%_0%,rgba(139,92,246,0.08),transparent_55%)]" />
        <div className="relative">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse text-left text-sm ${tableMinWidthClass}`}>
            <tbody className="divide-y divide-slate-100/80">
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4" colSpan={skeletonColSpan}>
                    <Skeleton className="h-12 w-full rounded-xl bg-slate-100/70" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <p className="text-sm text-slate-400">{emptyMessage}</p>
          {emptyAction ? <div className="mt-3">{emptyAction}</div> : null}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
