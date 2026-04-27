"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

type EvolutionRow = {
  key: string;
  labelShort: string;
  labelFull: string;
  sobebraPrice: number;
  marketPrice: number | null;
};

type EvolutionResponse = {
  productName: string;
  sobebraNote: string;
  series: EvolutionRow[];
};

type ProductOption = { _id: string; name: string };

async function fetchProducts(): Promise<ProductOption[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("products");
  const data = (await res.json()) as Array<{ _id: string; name: string }>;
  return data.map((p) => ({ _id: p._id, name: p.name }));
}

async function fetchEvolution(productId: string): Promise<EvolutionResponse> {
  const res = await fetch(`/api/analytics/product-price-evolution?productId=${encodeURIComponent(productId)}`);
  if (!res.ok) throw new Error("evolution");
  return res.json();
}

const COLOR_MARKET = "#EF4444";
const COLOR_SOBEBRA = "#6366F1";

function PriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: { labelFull: string; marketValue?: number; sobebraPrice: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const market = row.marketValue;
  return (
    <div className="rounded-xl border border-white/80 bg-white px-3 py-2.5 shadow-lg">
      <p className="text-sm font-semibold text-[#111827]">{row.labelFull ?? label}</p>
      <p className="mt-1 text-xs text-[#6B7280]">
        {market != null && Number.isFinite(market) ? (
          <>
            <span className="font-medium" style={{ color: COLOR_MARKET }}>
              Prix marché
            </span>
            {" · "}
            {formatCurrency(market)}
          </>
        ) : (
          <span>Prix marché — non renseigné</span>
        )}
      </p>
      <p className="text-xs text-[#6B7280]">
        <span className="font-medium" style={{ color: COLOR_SOBEBRA }}>
          Prix SOBEBRA
        </span>
        {" · "}
        {formatCurrency(row.sobebraPrice)}
      </p>
    </div>
  );
}

export default function PriceEvolutionChart() {
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const [productId, setProductId] = useState<string>("");
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["analytics-price-products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!productId && products?.length) {
      setProductId(products[0]._id);
    }
  }, [products, productId]);

  useEffect(() => {
    setHighlightedKey(null);
  }, [productId]);

  const { data: evolution, isLoading: evolutionLoading } = useQuery({
    queryKey: ["analytics-product-price-evolution", productId],
    queryFn: () => fetchEvolution(productId),
    enabled: Boolean(productId),
    staleTime: 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!evolution?.series?.length) return [];
    return evolution.series.map((s) => ({
      ...s,
      marketValue: s.marketPrice == null || !Number.isFinite(s.marketPrice) ? undefined : s.marketPrice,
    }));
  }, [evolution]);

  useEffect(() => {
    if (!chartData.length) return;
    setHighlightedKey((prev) => {
      if (prev && chartData.some((d) => d.key === prev)) return prev;
      return chartData[chartData.length - 1].key;
    });
  }, [chartData]);

  const avgGapPct = useMemo(() => {
    const gaps: number[] = [];
    for (const row of chartData) {
      const m = row.marketValue;
      if (m == null || !Number.isFinite(m) || row.sobebraPrice <= 0) continue;
      gaps.push(((m - row.sobebraPrice) / row.sobebraPrice) * 100);
    }
    if (!gaps.length) return null;
    return gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }, [chartData]);

  const highlightedLabelShort = chartData.find((d) => d.key === highlightedKey)?.labelShort;

  const scrollMonths = (dir: "up" | "down") => {
    const el = monthScrollRef.current;
    if (!el) return;
    el.scrollBy({ top: dir === "up" ? -48 : 48, behavior: "smooth" });
  };

  const loading = productsLoading || (Boolean(productId) && evolutionLoading);
  const noProducts = !productsLoading && (!products || products.length === 0);

  return (
    <div className="rounded-[20px] bg-[#E8E8EA] p-5 sm:p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-[#0D0D0D] sm:text-xl">Prix catalogue vs marché</h3>
          <p className="mt-0.5 text-sm text-[#6B7280]">Comparatif mensuel sur 12 mois — sélectionnez un produit</p>
        </div>
        <Select value={productId} onValueChange={setProductId} disabled={!products?.length}>
          <SelectTrigger className="h-10 w-full min-w-[200px] max-w-[280px] rounded-xl border-[#D1D5DB] bg-white text-left text-sm shadow-none sm:w-[280px]">
            <SelectValue placeholder="Produit" />
          </SelectTrigger>
          <SelectContent>
            {products?.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {evolution?.sobebraNote ? (
        <p className="mb-4 text-xs leading-relaxed text-[#6B7280]">{evolution.sobebraNote}</p>
      ) : null}

      <div className="flex gap-2 sm:gap-3">
        <div className="flex w-11 shrink-0 flex-col items-center sm:w-12">
          <button
            type="button"
            aria-label="Faire défiler les mois vers le haut"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#9CA3AF] transition hover:bg-black/5 hover:text-[#374151]"
            onClick={() => scrollMonths("up")}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <div
            ref={monthScrollRef}
            className="my-1 flex max-h-[200px] flex-col gap-1 overflow-y-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chartData.map((m) => {
              const selected = m.key === highlightedKey;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setHighlightedKey(m.key)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-2.5 py-1.5 text-center text-[11px] font-medium transition sm:text-xs",
                    selected
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "text-[#6B7280] hover:bg-black/[0.06] hover:text-[#111827]"
                  )}
                >
                  {m.labelShort}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="Faire défiler les mois vers le bas"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#9CA3AF] transition hover:bg-black/5 hover:text-[#374151]"
            onClick={() => scrollMonths("down")}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="relative min-h-[220px] min-w-0 flex-1 rounded-2xl bg-[#F3F3F5]/90 p-2 sm:min-h-[240px] sm:p-3">
          {noProducts ? (
            <div className="flex h-[220px] items-center justify-center px-4 text-center text-sm text-[#9CA3AF] sm:h-[240px]">
              Aucun produit en catalogue. Créez un produit pour afficher l’évolution des prix.
            </div>
          ) : loading ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-[#9CA3AF] sm:h-[240px]">
              Chargement…
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-[#9CA3AF] sm:h-[240px]">
              Aucune donnée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid stroke="#D4D4D8" strokeDasharray="2 6" vertical />
                <XAxis
                  dataKey="labelShort"
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  dy={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                />
                <Tooltip content={<PriceTooltip />} cursor={{ stroke: "#A1A1AA", strokeWidth: 1 }} />
                {highlightedLabelShort ? (
                  <ReferenceLine x={highlightedLabelShort} stroke="#94A3B8" strokeDasharray="4 4" />
                ) : null}
                <Line
                  type="natural"
                  dataKey="marketValue"
                  name="Prix marché"
                  stroke={COLOR_MARKET}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, fill: "#fff", stroke: COLOR_MARKET, strokeWidth: 2 }}
                />
                <Line
                  type="natural"
                  dataKey="sobebraPrice"
                  name="Prix SOBEBRA"
                  stroke={COLOR_SOBEBRA}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, fill: "#fff", stroke: COLOR_SOBEBRA, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2.5 text-xs text-[#374151]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: COLOR_MARKET }} />
            <span className="font-medium">Prix marché</span>
            <span className="text-[#9CA3AF]">(dernier appro du mois)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: COLOR_SOBEBRA }} />
            <span className="font-medium">Prix SOBEBRA</span>
            <span className="text-[#9CA3AF]">(catalogue actuel)</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-3xl font-semibold tabular-nums tracking-tight text-[#0D0D0D] sm:text-4xl">
            {avgGapPct != null ? `${avgGapPct.toFixed(1)}%` : "—"}
          </div>
          <div className="mt-0.5 text-xs text-[#6B7280]">Écart moyen (marché vs SOBEBRA)</div>
        </div>
      </div>

    </div>
  );
}
