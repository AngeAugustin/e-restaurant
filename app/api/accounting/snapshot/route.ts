import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { OPERATIONS_ROLES } from "@/lib/roles";
import { buildAccountingSnapshot } from "@/lib/accounting";
import { resolveAccountingWindow } from "@/lib/accounting-window";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth([...OPERATIONS_ROLES]);
  if (error) return error;

  await connectDB();
  const search = req.nextUrl.searchParams;
  let window;
  try {
    window = resolveAccountingWindow({
      filter: search.get("filter"),
      year: search.get("year"),
      month: search.get("month"),
      from: search.get("from"),
      to: search.get("to"),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Période invalide" }, { status: 400 });
  }

  const snapshot = await buildAccountingSnapshot(window);
  return NextResponse.json(snapshot);
}
