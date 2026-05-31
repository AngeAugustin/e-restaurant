/**
 * Migre les images produit locales (`/uploads/products/...`) vers MongoDB.
 * Seuls les fichiers référencés par au moins un produit sont migrés.
 * Les fichiers sur disque restent en archive (non supprimés).
 *
 * Usage (PowerShell) :
 *   node scripts/migrate-product-images-to-mongo.mjs
 *
 * Optionnel :
 *   node scripts/migrate-product-images-to-mongo.mjs --dry-run
 */

import { readFileSync, existsSync } from "fs";
import { readFile } from "fs/promises";
import { resolve, join, extname } from "path";
import { MongoClient, ObjectId } from "mongodb";

function loadEnvFromFile() {
  for (const name of [".env.local", ".env"]) {
    const full = resolve(process.cwd(), name);
    if (!existsSync(full)) continue;
    const text = readFileSync(full, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

loadEnvFromFile();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Définissez MONGODB_URI (ou un fichier .env.local avec MONGODB_URI).");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const LOCAL_PREFIX = "/uploads/products/";
const UPLOADS_DIR = join(process.cwd(), "public", "uploads", "products");

function mimeFromFilename(filename) {
  const ext = extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

function productImagePublicPath(id) {
  return `/api/media/products/${id}`;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const productsCol = db.collection("products");
  const imagesCol = db.collection("productimages");

  const products = await productsCol
    .find({ image: { $regex: "^/uploads/products/" } })
    .project({ _id: 1, name: 1, image: 1 })
    .toArray();

  if (products.length === 0) {
    console.log("Aucun produit avec une image locale à migrer.");
    await client.close();
    return;
  }

  /** @type {Map<string, string>} chemin public -> nouvelle URL mongo */
  const pathToUrl = new Map();
  let inserted = 0;
  let updatedProducts = 0;
  let missingFiles = 0;
  let skippedAlreadyMigrated = 0;

  const uniquePaths = [...new Set(products.map((p) => String(p.image).trim()).filter(Boolean))];
  console.log(`${products.length} produit(s), ${uniquePaths.length} chemin(s) image distinct(s).`);

  for (const publicPath of uniquePaths) {
    if (!publicPath.startsWith(LOCAL_PREFIX)) continue;

    const filename = publicPath.slice(LOCAL_PREFIX.length);
    if (!filename || filename.includes("..") || filename.includes("/")) {
      console.warn(`Chemin ignoré (invalide) : ${publicPath}`);
      continue;
    }

    const fullPath = join(UPLOADS_DIR, filename);
    if (!existsSync(fullPath)) {
      console.warn(`Fichier manquant pour ${publicPath} (${fullPath})`);
      missingFiles += 1;
      continue;
    }

    let buffer;
    try {
      buffer = await readFile(fullPath);
    } catch (err) {
      console.warn(`Lecture impossible pour ${publicPath} :`, err.message);
      missingFiles += 1;
      continue;
    }

    if (dryRun) {
      const fakeId = new ObjectId();
      pathToUrl.set(publicPath, productImagePublicPath(String(fakeId)));
      inserted += 1;
      continue;
    }

    const now = new Date();
    const insertResult = await imagesCol.insertOne({
      data: buffer,
      contentType: mimeFromFilename(filename),
      filename,
      createdAt: now,
      updatedAt: now,
    });
    const newUrl = productImagePublicPath(String(insertResult.insertedId));
    pathToUrl.set(publicPath, newUrl);
    inserted += 1;
    console.log(`Migré : ${publicPath} -> ${newUrl}`);
  }

  for (const product of products) {
    const publicPath = String(product.image ?? "").trim();
    const newUrl = pathToUrl.get(publicPath);
    if (!newUrl) continue;

    if (dryRun) {
      updatedProducts += 1;
      continue;
    }

    const result = await productsCol.updateOne(
      { _id: product._id, image: publicPath },
      { $set: { image: newUrl } }
    );
    if (result.modifiedCount > 0) {
      updatedProducts += 1;
    } else {
      skippedAlreadyMigrated += 1;
    }
  }

  await client.close();

  const mode = dryRun ? " (simulation)" : "";
  console.log(`\nMigration terminée${mode}.`);
  console.log(`  Images insérées en base : ${inserted}`);
  console.log(`  Produits mis à jour       : ${updatedProducts}`);
  if (missingFiles) console.log(`  Fichiers manquants      : ${missingFiles}`);
  if (skippedAlreadyMigrated) console.log(`  Déjà à jour             : ${skippedAlreadyMigrated}`);
  console.log("  Fichiers disque conservés dans public/uploads/products/ (archive).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
