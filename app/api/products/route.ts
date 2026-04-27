import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import Product from "@/models/Product";
import { isValidProductCategory } from "@/lib/product-categories";
import { parsePriceBodyField, resolveCatalogPriceForImport } from "@/lib/product-market-price";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  await connectDB();
  const products = await Product.find().sort({ createdAt: -1 });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();

  const body = await req.json();
  const { name, image, sellingPrice, category, defaultMarketSellingPrice } = body;

  if (!name || !category) {
    return NextResponse.json({ error: "Nom et catégorie requis" }, { status: 400 });
  }

  const marketDef = parsePriceBodyField(defaultMarketSellingPrice);
  const sobebraRaw = parsePriceBodyField(sellingPrice);
  const resolved = resolveCatalogPriceForImport(sobebraRaw, marketDef);
  if (!resolved) {
    return NextResponse.json(
      { error: "Prix de vente marché requis. Le prix SOBEBRA est optionnel (déduit automatiquement si absent ou 0 avec un marché > 1)." },
      { status: 400 }
    );
  }

  if (!isValidProductCategory(category)) {
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  }

  const existing = await Product.findOne({ name: name.trim() });
  if (existing) {
    return NextResponse.json({ error: "Un produit avec ce nom existe déjà" }, { status: 409 });
  }

  const product = await Product.create({
    name: name.trim(),
    category,
    image: image || "",
    sellingPrice: resolved.sellingPrice,
    defaultMarketSellingPrice: resolved.defaultMarketSellingPrice,
  });

  return NextResponse.json(product, { status: 201 });
}
