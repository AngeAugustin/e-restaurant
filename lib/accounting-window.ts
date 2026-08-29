import type { AccountingFilter } from "@/types";

export const ACCOUNTING_MONTHS = [
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
] as const;

export function parseAccountingInstant(raw: string | null | undefined): Date {
  if (!raw || !raw.trim()) return new Date();
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Date invalide");
  }
  return parsed;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function parseDay(raw: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error("Date invalide");
  const [year, month, day] = raw.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) throw new Error("Date invalide");
  return date;
}

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function resolveAccountingWindow(search: {
  filter?: string | null;
  year?: string | null;
  month?: string | null;
  from?: string | null;
  to?: string | null;
}): { filter: AccountingFilter; from: Date; to: Date; label: string } {
  const now = new Date();
  const rawFilter = search.filter === "range" || search.filter === "year" ? search.filter : "month";

  if (rawFilter === "year") {
    const year = Number(search.year);
    const y = Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : now.getFullYear();
    const from = new Date(y, 0, 1);
    const to = endOfLocalDay(new Date(y, 11, 31));
    return { filter: "year", from, to, label: `Année ${y}` };
  }

  if (rawFilter === "range") {
    if (!search.from || !search.to) throw new Error("Indiquez une date de début et une date de fin");
    const start = parseDay(search.from);
    const end = parseDay(search.to);
    if (start.getTime() > end.getTime()) throw new Error("La date de début doit précéder la date de fin");
    return {
      filter: "range",
      from: startOfLocalDay(start),
      to: endOfLocalDay(end),
      label: `Du ${formatDayLabel(start)} au ${formatDayLabel(end)}`,
    };
  }

  const year = Number(search.year);
  const month = Number(search.month);
  const y = Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : now.getFullYear();
  const m = Number.isInteger(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1;
  const from = new Date(y, m - 1, 1);
  const to = endOfLocalDay(new Date(y, m, 0));
  const monthLabel = ACCOUNTING_MONTHS[m - 1]?.label ?? `Mois ${m}`;
  return { filter: "month", from, to, label: `${monthLabel} ${y}` };
}
