import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import Product from "@/models/Product";
import { isValidProductCategory } from "@/lib/product-categories";
import { marketPriceAboveCatalogError, resolveCatalogPriceForImport } from "@/lib/product-market-price";

type ImportRowPayload = {
  name: string;
  category: string;
  sellingPrice?: number | string | null;
  defaultMarketSellingPrice: number | string | null;
  image?: string;
};

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const body = (await req.json()) as { rows?: ImportRowPayload[] };
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne à importer." }, { status: 400 });
  }

  const sanitized = rows
    .map((row) => {
      const name = String(row.name ?? "").trim();
      const rawS = row.sellingPrice as number | string | null | undefined;
      const sellingMaybe =
        rawS === undefined || rawS === null || (typeof rawS === "string" && rawS.trim() === "")
          ? null
          : Number(rawS);
      const sellingPrice = Number.isFinite(sellingMaybe as number) ? (sellingMaybe as number) : null;
      const rawM = row.defaultMarketSellingPrice as number | string | null | undefined;
      const market =
        rawM === undefined || rawM === null || (typeof rawM === "string" && rawM.trim() === "")
          ? NaN
          : Number(rawM);
      const resolved = resolveCatalogPriceForImport(sellingPrice, market);
      if (!resolved) return null;
      return {
        name,
        category: row.category,
        sellingPrice: resolved.sellingPrice,
        defaultMarketSellingPrice: resolved.defaultMarketSellingPrice,
        image: typeof row.image === "string" ? row.image.trim() : "",
      };
    })
    .filter(
      (row): row is NonNullable<typeof row> =>
        row !== null &&
        row.name !== "" &&
        isValidProductCategory(row.category) &&
        marketPriceAboveCatalogError(row.sellingPrice, row.defaultMarketSellingPrice) === null
    );

  if (sanitized.length === 0) {
    return NextResponse.json({ error: "Aucune ligne valide à importer." }, { status: 400 });
  }

  const names = sanitized.map((r) => r.name);
  const existing = await Product.find({ name: { $in: names } }).select("name").lean();
  const existingSet = new Set(existing.map((e) => String(e.name).trim().toLowerCase()));

  const uniqueRows: typeof sanitized = [];
  const localSeen = new Set<string>();

  for (const row of sanitized) {
    const key = row.name.toLowerCase();
    if (existingSet.has(key) || localSeen.has(key)) continue;
    localSeen.add(key);
    uniqueRows.push(row);
  }

  if (uniqueRows.length > 0) {
    await Product.insertMany(uniqueRows, { ordered: false });
  }

  return NextResponse.json({
    importedCount: uniqueRows.length,
    skippedCount: sanitized.length - uniqueRows.length,
    totalRequested: rows.length,
  });
}
