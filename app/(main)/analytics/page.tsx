"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { exportAnalyticsReportPdf, type AnalyticsReportPayload } from "@/lib/analytics-report-pdf";
import type { AnalyticsData } from "@/types";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 gap-6">
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  ),
});

type AnalyticsFilter = "week" | "month" | "semester" | "year" | "custom";

async function fetchAnalytics(params: {
  filter: AnalyticsFilter;
  year?: number;
  month?: number;
  semester?: number;
  from?: string;
  to?: string;
}): Promise<AnalyticsData> {
  const search = new URLSearchParams({ filter: params.filter });
  if (params.year) search.set("year", String(params.year));
  if (params.month) search.set("month", String(params.month));
  if (params.semester) search.set("semester", String(params.semester));
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const res = await fetch(`/api/analytics?${search.toString()}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function buildAnalyticsSearchParams(params: {
  filter: AnalyticsFilter;
  year?: number;
  month?: number;
  semester?: number;
  from?: string;
  to?: string;
}): URLSearchParams {
  const search = new URLSearchParams({ filter: params.filter });
  if (params.year) search.set("year", String(params.year));
  if (params.month) search.set("month", String(params.month));
  if (params.semester) search.set("semester", String(params.semester));
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  return search;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const now = new Date();
  const currentYear = now.getFullYear();
  const [filter, setFilter] = useState<AnalyticsFilter>("year");
  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [semester, setSemester] = useState<number>(now.getMonth() < 6 ? 1 : 2);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedCustom, setAppliedCustom] = useState<{ from: string; to: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const hasInvalidCustomRange = Boolean(customFrom && customTo && customFrom > customTo);
  const canApplyCustom = Boolean(customFrom && customTo && !hasInvalidCustomRange);

  const queryParams = useMemo(() => {
    if (filter === "week") return { filter } as const;
    if (filter === "month") return { filter, year, month } as const;
    if (filter === "semester") return { filter, year, semester } as const;
    if (filter === "custom")
      return {
        filter,
        from: appliedCustom?.from ?? "",
        to: appliedCustom?.to ?? "",
      } as const;
    return { filter, year } as const;
  }, [appliedCustom?.from, appliedCustom?.to, filter, month, semester, year]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "analytics",
      queryParams.filter,
      "year" in queryParams ? queryParams.year : null,
      "month" in queryParams ? queryParams.month : null,
      "semester" in queryParams ? queryParams.semester : null,
      "from" in queryParams ? queryParams.from : null,
      "to" in queryParams ? queryParams.to : null,
    ],
    queryFn: () => fetchAnalytics(queryParams),
    enabled:
      session?.user?.role === "directeur" &&
      (filter !== "custom" || Boolean(appliedCustom?.from && appliedCustom?.to)),
    staleTime: 60 * 1000,
  });

  if (status === "loading") return <Skeleton className="h-96" />;
  if (session?.user?.role !== "directeur") {
    return <p className="py-20 text-center text-muted-foreground">Accès réservé au Directeur</p>;
  }

  const summary = data?.summary;
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalProfit = summary?.totalGrossProfit ?? 0;
  const totalSales = summary?.totalSales ?? 0;
  const marginRate = summary?.marginRate ?? 0;
  const revenueDelta = summary?.revenueDeltaPct ?? 0;
  const profitDelta = summary?.profitDeltaPct ?? 0;
  const products = data?.productRevenue ?? [];
  const productsTotalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const monthOptions = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" },
  ];

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      const search = buildAnalyticsSearchParams(queryParams);
      const res = await fetch(`/api/analytics/report?${search.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const report = (await res.json()) as AnalyticsReportPayload;
      await exportAnalyticsReportPdf(report);
    } finally {
      setIsExporting(false);
    }
  };

  const filtersAction = (
    <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select value={filter} onValueChange={(value) => setFilter(value as AnalyticsFilter)}>
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Choisir une période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="year">Année</SelectItem>
            <SelectItem value="semester">Semestre</SelectItem>
            <SelectItem value="month">Mois</SelectItem>
            <SelectItem value="week">Semaine</SelectItem>
            <SelectItem value="custom">Période personnalisée</SelectItem>
          </SelectContent>
        </Select>

        {(filter === "year" || filter === "semester" || filter === "month") && (
          <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filter === "month" && (
          <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filter === "semester" && (
          <Select value={String(semester)} onValueChange={(value) => setSemester(Number(value))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Semestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Semestre 1</SelectItem>
              <SelectItem value="2">Semestre 2</SelectItem>
            </SelectContent>
          </Select>
        )}

        {filter === "custom" && (
          <>
            <Input
              className="w-[150px]"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <Input className="w-[150px]" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            <Button
              variant="outline"
              onClick={() => setAppliedCustom({ from: customFrom, to: customTo })}
              disabled={!canApplyCustom}
            >
              Appliquer
            </Button>
          </>
        )}
        <Button
          onClick={handleExportReport}
          disabled={isLoading || isExporting || !data}
          className="min-w-[110px]"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Export..." : "Exporter"}
        </Button>
      </div>
      {filter === "custom" && hasInvalidCustomRange ? (
        <p className="text-xs text-red-700">La date de début doit être antérieure à la date de fin.</p>
      ) : null}
      <p className="text-right text-xs text-muted-foreground">
        Période active : <span className="font-medium text-foreground">{data?.period.label ?? "..."}</span>
      </p>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Analytiques"
        subtitle="Visualisations avancées et tendances"
        action={filtersAction}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chiffre d&apos;affaires ({data?.period.label ?? "Période"})</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? "..." : formatCurrency(totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Variation vs période précédente</p>
            <Badge className="mt-2" variant={revenueDelta >= 0 ? "success" : "destructive"}>
              {revenueDelta >= 0 ? "+" : ""}
              {formatPercentage(revenueDelta)} vs période précédente
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bénéfice brut ({data?.period.label ?? "Période"})</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? "..." : formatCurrency(totalProfit)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Variation vs période précédente</p>
            <Badge className="mt-2" variant={profitDelta >= 0 ? "success" : "destructive"}>
              {profitDelta >= 0 ? "+" : ""}
              {formatPercentage(profitDelta)} vs période précédente
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux de marge brut</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? "..." : formatPercentage(marginRate)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Bénéfice brut / CA sur la période</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventes clôturées</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? "..." : totalSales}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Nombre total de ventes sur la période</p>
          </CardContent>
        </Card>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <AnalyticsCharts data={data} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance par Produit</CardTitle>
            <CardDescription>Détail complet — unités vendues, revenus et bénéfice</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 pb-4">
                <p className="text-sm text-muted-foreground">
                  Classement des produits par performance commerciale sur la période active.
                </p>
                <Badge variant="secondary">{products.length} produits</Badge>
              </div>
            )}
            {!isLoading && (
              <>
                <Separator className="mb-4" />
                <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        #
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Produit
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Prix unitaire
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Unités vendues
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Revenus
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Bénéfice
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        % du CA
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={product.name} className="border-b transition-colors hover:bg-muted/30">
                        <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="px-3 py-3 font-medium text-foreground">{product.name}</td>
                        <td className="px-3 py-3 text-right text-muted-foreground">
                          {formatCurrency(product.price ?? 0)}
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground">{product.units}</td>
                        <td className="px-3 py-3 text-right font-semibold text-foreground">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-emerald-700">
                          {formatCurrency(product.margin ?? 0)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${productsTotalRevenue > 0 ? (product.revenue / productsTotalRevenue) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs text-muted-foreground">
                              {productsTotalRevenue > 0
                                ? ((product.revenue / productsTotalRevenue) * 100).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
