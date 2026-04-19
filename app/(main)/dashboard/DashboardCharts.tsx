"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { DashboardStats, ISale } from "@/types";
import { formatSaleTablesLine } from "@/lib/sale-tables";
import { CheckCircle, Clock } from "lucide-react";

const SALES_LINE_COLOR = "#0F7669";

const SalesTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-3 text-xs shadow-lg">
        <p className="mb-1 text-[#6B7280]">{label}</p>
        <p className="text-sm font-semibold text-[#0D0D0D]">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

function formatYAxisRevenue(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `${v}`;
}

/** Hauteur commune des zones graphique (Ventes 7j + Top produits) */
const CHART_HEIGHT = 280;

/** Couleurs type « conformité » : bleu, orange, teal, puis compléments pour 5 segments */
const TOP_PRODUCT_COLORS = ["#2563EB", "#EA580C", "#0F7669", "#7C3AED", "#64748B"] as const;

type TopProductRow = { name: string; sold: number; revenue: number };

function TopProductsDonut({ products }: { products: TopProductRow[] }) {
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

  return (
    <div className="flex h-full min-h-0 flex-col items-stretch gap-2 overflow-y-auto overflow-x-hidden lg:flex-row lg:items-center lg:gap-4 lg:overflow-y-visible">
      <div className="mx-auto h-[140px] w-full max-w-[200px] shrink-0 sm:h-[158px] lg:mx-0 lg:h-[182px] lg:w-[44%] lg:max-w-[220px]">
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
              <span className="min-w-0 max-w-[min(100%,10rem)] truncate text-[#374151]" title={row.name}>
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

export default function DashboardCharts({ data }: { data: DashboardStats }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-[13fr_7fr]">
        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="space-y-1.5 pb-3">
              <CardTitle className="text-lg font-bold tracking-tight text-[#0D0D0D]">
                Ventes — 7 derniers jours
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-[#6B7280]">
                Évolution du chiffre d&apos;affaires jour après jour sur la semaine glissante
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-5">
              <div className="min-h-0 w-full" style={{ height: CHART_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.weeklyRevenue}
                    margin={{ top: 8, right: 8, bottom: 36, left: 0 }}
                  >
                    <CartesianGrid
                      stroke="#ECECED"
                      strokeWidth={1}
                      vertical={false}
                      horizontal
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      tickLine={false}
                      axisLine={false}
                      dy={6}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tickFormatter={formatYAxisRevenue}
                      domain={[0, "auto"]}
                    />
                    <Tooltip content={<SalesTooltip />} cursor={{ stroke: "#E5E5E5", strokeWidth: 1 }} />
                    <Line
                      type="natural"
                      dataKey="revenue"
                      name="Chiffre d'affaires"
                      stroke={SALES_LINE_COLOR}
                      strokeWidth={2.75}
                      dot={false}
                      activeDot={false}
                      isAnimationActive
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="square"
                      iconSize={10}
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value) => (
                        <span className="text-xs font-medium text-[#6B7280]">{value}</span>
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-base">Top 5 produits</CardTitle>
              <CardDescription className="text-xs leading-snug">
                Répartition des quantités vendues (unités)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-0" style={{ height: CHART_HEIGHT }}>
                <TopProductsDonut products={data.topProducts ?? []} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSales?.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-8">Aucune vente récente</p>
            ) : (
              <div className="space-y-2">
                {data.recentSales?.map((sale: ISale) => {
                  const waitress = sale.waitress as { firstName: string; lastName: string };
                  const tablesLine = formatSaleTablesLine(sale);
                  const saleId = typeof sale._id === "string" ? sale._id : String(sale._id);
                  return (
                    <Link
                      key={saleId}
                      href={`/sales/${saleId}`}
                      className="flex items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D0D0D] focus-visible:ring-offset-2"
                      aria-label={`Voir la vente — ${tablesLine}`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5]">
                          {sale.status === "COMPLETED" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0D0D0D]">
                            {tablesLine} — {waitress?.firstName} {waitress?.lastName}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">{formatDateTime(sale.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 pl-2">
                        <Badge variant={sale.status === "COMPLETED" ? "success" : "pending"}>
                          {sale.status === "COMPLETED" ? "Clôturée" : "En attente"}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums text-[#0D0D0D]">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
