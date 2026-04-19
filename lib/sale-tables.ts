import type { ISale, IRestaurantTable } from "@/types";

type TableRef = { _id?: string; number?: number; name?: string };

/** Ids de tables à partir d’une vente renvoyée par l’API (lean / JSON). */
export function saleTableIdsFromPayload(sale: {
  tables?: unknown;
  table?: unknown;
}): string[] {
  const fromArray = sale.tables;
  if (Array.isArray(fromArray) && fromArray.length > 0) {
    return fromArray
      .map((t) => {
        if (typeof t === "string") return t;
        if (t && typeof t === "object" && "_id" in t) return String((t as { _id: string })._id);
        return "";
      })
      .filter(Boolean);
  }
  const single = sale.table;
  if (single == null) return [];
  if (typeof single === "string") return [single];
  if (typeof single === "object" && "_id" in single && (single as { _id: unknown })._id != null) {
    return [String((single as { _id: string })._id)];
  }
  return [];
}

function tableRefLabel(t: TableRef | string): string {
  if (typeof t === "string") return "—";
  return t?.name?.trim() ? t.name : `Table ${t?.number ?? "—"}`;
}

/** Libellé pour affichage (plusieurs tables séparées par des virgules). */
export function formatSaleTablesLine(sale: ISale): string {
  const list = sale.tables;
  if (Array.isArray(list) && list.length > 0) {
    return list.map((t) => tableRefLabel(t as TableRef | string)).join(", ");
  }
  if (sale.table != null) {
    return tableRefLabel(sale.table as TableRef);
  }
  return "—";
}

/** Libellés courts pour une liste de tables catalogue (wizard). */
export function formatTableIdsWithCatalog(
  tableIds: string[],
  catalog: Pick<IRestaurantTable, "_id" | "number" | "name">[] | undefined
): string {
  return tableIds
    .map((id) => catalog?.find((x) => x._id === id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((t) => (t.name?.trim() ? t.name : `Table ${t.number}`))
    .join(", ");
}
