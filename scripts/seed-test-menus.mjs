/**
 * Insère ~30 menus de test (sans photo).
 *
 * Usage :
 *   node scripts/seed-test-menus.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { MongoClient } from "mongodb";

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

/** Menus typiques restaurant / cuisine locale — prix en FCFA */
const MENUS = [
  { name: "Riz sauce arachide", price: 1500 },
  { name: "Riz sauce tomate", price: 1200 },
  { name: "Riz sauce palmiste", price: 1800 },
  { name: "Akassa sauce gboma", price: 1000 },
  { name: "Pâte d'igname + sauce", price: 1500 },
  { name: "Foutou banane + sauce", price: 1600 },
  { name: "Amiwo au poulet", price: 2000 },
  { name: "Poulet braisé", price: 2500 },
  { name: "Poisson braisé", price: 2200 },
  { name: "Poisson frit", price: 2000 },
  { name: "Atiéké poisson", price: 1800 },
  { name: "Alloco + œuf", price: 1000 },
  { name: "Alloco + poulet", price: 2000 },
  { name: "Garba thon", price: 800 },
  { name: "Spaghetti sauté", price: 1200 },
  { name: "Riz cantonais", price: 1500 },
  { name: "Poulet yassa", price: 2500 },
  { name: "Mafé boeuf", price: 2200 },
  { name: "Thiéboudienne", price: 2500 },
  { name: "Ragout de mouton", price: 2800 },
  { name: "Sauce claire légumes", price: 1200 },
  { name: "Sauce gombo", price: 1300 },
  { name: "Kédjénou poulet", price: 2300 },
  { name: "Brochettes de boeuf", price: 1500 },
  { name: "Brochettes de mouton", price: 1800 },
  { name: "Salade composée", price: 1000 },
  { name: "Omelette complète", price: 900 },
  { name: "Sandwich poulet", price: 1200 },
  { name: "Burger maison", price: 2000 },
  { name: "Pizza margherita", price: 2500 },
  { name: "Jus de bissap", price: 500 },
  { name: "Jus d'ananas", price: 500 },
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const col = db.collection("menus");

  const now = new Date();
  let inserted = 0;
  let skipped = 0;

  for (const menu of MENUS) {
    const existing = await col.findOne({ name: menu.name });
    if (existing) {
      skipped += 1;
      continue;
    }
    await col.insertOne({
      name: menu.name,
      image: "",
      price: menu.price,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    inserted += 1;
  }

  console.log(`Menus de test : ${inserted} créés, ${skipped} déjà présents (total catalogue: ${MENUS.length}).`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
