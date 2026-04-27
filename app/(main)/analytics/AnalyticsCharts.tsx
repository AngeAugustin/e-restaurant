"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TopProductsDonut } from "@/components/shared/TopProductsDonut";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsData } from "@/types";
import PriceEvolutionChart from "./PriceEvolutionChart";

const PRIMARY_COLOR = "hsl(var(--primary))";

function formatTooltipDateLabel(label?: string): string {
  if (!label) return "";

  const dayMonth = /^(\d{2})\/(\d{2})$/;
  const monthYear = /^(\d{2})\/(\d{4})$/;

  const dm = label.match(dayMonth);
  if (dm) {
    const day = Number(dm[1]);
    const month = Number(dm[2]);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const d = new Date(new Date().getFullYear(), month - 1, day);
      const formatted = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(d);
      return formatted.endsWith(".") ? formatted : `${formatted}.`;
    }
  }

  const my = label.match(monthYear);
  if (my) {
    const month = Number(my[1]);
    const year = Number(my[2]);
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      const d = new Date(year, month - 1, 1);
      const monthShort = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d);
      return `${monthShort.endsWith(".") ? monthShort : `${monthShort}.`} ${year}`;
    }
  }

  return label;
}

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-lg p-3 shadow-lg text-xs">
        <p className="font-medium text-[#374151] mb-1">{formatTooltipDateLabel(label)}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}:{" "}
            {typeof p.value === "number" && ["Revenus", "Bénéfice brut"].includes(p.name)
              ? formatCurrency(p.value)
              : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const top3Products = [...data.productRevenue]
    .sort((a, b) => b.units - a.units)
    .slice(0, 3)
    .map((p) => ({ name: p.name, sold: p.units, revenue: p.revenue }));

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[7fr_3fr]">
        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Évolution du Chiffre d&apos;Affaires</CardTitle>
              <CardDescription>Période sélectionnée — revenus, bénéfice brut et nombre de ventes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenueEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="sales"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    name="Revenus"
                    fill={PRIMARY_COLOR}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="revenue"
                    dataKey="grossProfit"
                    name="Bénéfice brut"
                    fill="#15803d"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="sales"
                    dataKey="sales"
                    name="Ventes"
                    fill="#9CA3AF"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="flex h-full flex-col">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-base">Top 3 produits</CardTitle>
              <CardDescription className="text-xs leading-snug">
                Répartition des quantités vendues (unités) sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-5">
              <div className="min-h-0 w-full flex-1" style={{ height: 300 }}>
                <TopProductsDonut products={top3Products} stackLayout />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Revenus et bénéfice par produit</CardTitle>
            <CardDescription>Bénéfice brut cumulé (bénéfice = CA − coût selon les lignes de vente)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.productRevenue.slice(0, 10)} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#374151" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "Revenus" ? "Revenus" : "Bénéfice",
                  ]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E5E5E5", fontSize: "12px" }}
                />
                <Legend />
                <Bar dataKey="revenue" fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} name="Revenus" />
                <Bar dataKey="margin" fill="#15803d" radius={[4, 4, 0, 0]} name="Bénéfice" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <PriceEvolutionChart />
      </motion.div>
    </div>
  );
}
