import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { OPERATIONS_ROLES } from "@/lib/roles";
import CashSession from "@/models/CashSession";
import KitchenOrder from "@/models/KitchenOrder";
import { buildCashSessionName, kitchenCashSessionFilter } from "@/lib/cash-session";

export async function GET() {
  const { error } = await requireAuth([...OPERATIONS_ROLES]);
  if (error) return error;

  await connectDB();
  const sessions = await CashSession.find(kitchenCashSessionFilter())
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean();

  const sessionsWithSummary = await Promise.all(
    sessions.map(async (s) => {
      const start = new Date(s.createdAt);
      const end = s.closedAt ? new Date(s.closedAt) : new Date();

      const createdAt = { $gte: start, $lte: end };
      const [orders, pendingCount] = await Promise.all([
        KitchenOrder.find({ status: "COMPLETED", createdAt })
          .select("totalAmount")
          .lean<Array<{ totalAmount?: number }>>(),
        KitchenOrder.countDocuments({ status: "PENDING", createdAt }),
      ]);

      const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);

      return {
        ...s,
        financialSummary: {
          totalSales,
          totalSupplies: 0,
          completedCount: orders.length,
          pendingCount,
        },
      };
    })
  );

  return NextResponse.json(sessionsWithSummary);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth([...OPERATIONS_ROLES]);
  if (error) return error;

  await connectDB();
  const body = await req.json();

  const openingFloat = Number(body?.openingFloat);
  if (!Number.isFinite(openingFloat) || openingFloat < 0) {
    return NextResponse.json({ error: "Fond de caisse invalide." }, { status: 400 });
  }

  const active = await CashSession.findOne({ ...kitchenCashSessionFilter(), status: "OPEN" })
    .select("_id")
    .lean();
  if (active) {
    return NextResponse.json(
      { error: "Une session cuisine est déjà ouverte. Clôturez-la avant d'en ouvrir une nouvelle." },
      { status: 409 }
    );
  }

  const now = new Date();
  const cashSession = await CashSession.create({
    name: buildCashSessionName(now, "KITCHEN"),
    sessionDate: now,
    openingFloat,
    kind: "KITCHEN",
    status: "OPEN",
    createdBy: session!.user.id,
  });

  return NextResponse.json(cashSession, { status: 201 });
}
