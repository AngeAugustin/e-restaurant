"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

/** Couleurs type « conformité » : bleu, orange, teal, puis compléments pour 5 segments */
export const TOP_PRODUCT_COLORS = ["#2563EB", "#EA580C", "#0F7669", "#7C3AED", "#64748B"] as const;

export type TopProductRow = { name: string; sold: number; revenue: number };

type TopProductsDonutProps = {
  products: TopProductRow[];
  /** En colonne étroite (ex. sidebar 30 %) : évite le mode côte-à-côte lg */
  stackLayout?: boolean;
};

export function TopProductsDonut({ products, stackLayout = false }: TopProductsDonutProps) {
  const totalSold = products.reduce((s, p) => s + p.sold, 0);

  if (products.length === 0) {
    return (
      <p className="flex h-full min-h-0 items-center justify-center text-sm text-[#9CA3AF]">
        Aucun produit vendu à afficher
      </p>
    );
  }

  const chartData = products.map((p, i) => ({
    ...p,
    fill: TOP_PRODUCT_COLORS[i % TOP_PRODUCT_COLORS.length],
    pct: totalSold > 0 ? Math.round((p.sold / totalSold) * 100) : 0,
  }));

  const rowClass = stackLayout
    ? "flex h-full min-h-0 flex-col items-stretch gap-2 overflow-y-auto overflow-x-hidden"
    : "flex h-full min-h-0 flex-col items-stretch gap-2 overflow-y-auto overflow-x-hidden lg:flex-row lg:items-center lg:gap-4 lg:overflow-y-visible";

  const donutBoxClass = stackLayout
    ? "mx-auto h-[140px] w-full max-w-[200px] shrink-0 sm:h-[158px]"
    : "mx-auto h-[140px] w-full max-w-[200px] shrink-0 sm:h-[158px] lg:mx-0 lg:h-[182px] lg:w-[44%] lg:max-w-[220px]";

  return (
    <div className={rowClass}>
      <div className={donutBoxClass}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Pie
              data={chartData}
              dataKey="sold"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="85%"
              paddingAngle={5}
              cornerRadius={8}
              stroke="none"
            >
              {chartData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={TOP_PRODUCT_COLORS[i % TOP_PRODUCT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as TopProductRow;
                return (
                  <div className="rounded-lg border border-[#E5E5E5] bg-white p-3 text-xs shadow-lg">
                    <p className="mb-1 font-medium text-[#0D0D0D]">{row.name}</p>
                    <p className="text-[#6B7280]">
                      {row.sold} unités · {formatCurrency(row.revenue)}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-2 overflow-y-auto lg:gap-2">
        {chartData.map((row, i) => (
          <li key={row.name} className="flex items-end gap-1.5 text-xs">
            <span
              className="mb-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: TOP_PRODUCT_COLORS[i % TOP_PRODUCT_COLORS.length] }}
            />
            <div className="flex min-w-0 flex-1 items-end gap-1.5">
              <span
                className={
                  stackLayout
                    ? "min-w-0 max-w-full flex-1 truncate text-[#374151]"
                    : "min-w-0 max-w-[min(100%,10rem)] truncate text-[#374151]"
                }
                title={row.name}
              >
                {row.name}
              </span>
              <span className="mb-1 min-h-px min-w-[6px] flex-1 border-b border-dotted border-[#D1D5DB]" />
            </div>
            <span className="mb-0.5 shrink-0 text-xs font-bold tabular-nums text-[#0D0D0D]">{row.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
