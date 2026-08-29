import { NextRequest, NextResponse } from "next/server";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import CashSession from "@/models/CashSession";
import { barCashSessionFilter } from "@/lib/cash-session";

type LeanBarSession = {
  _id: Types.ObjectId;
  status: "OPEN" | "CLOSED";
  kind?: string | null;
  openingFloat: number;
  openingFloatRecovered?: boolean;
  closedAt?: Date;
};

async function loadBarSession(id: string) {
  const cashSession = await CashSession.findById(id).lean<LeanBarSession | null>();
  if (!cashSession || cashSession.kind === "KITCHEN") return null;
  return cashSession;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur", "gerant"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const action = String(body?.action ?? "update");

  const cashSession = await loadBarSession(id);
  if (!cashSession) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }

  if (action === "close") {
    if (cashSession.status === "CLOSED") {
      return NextResponse.json({ error: "Cette session est déjà clôturée." }, { status: 400 });
    }
    const openingFloatRecovered = body?.openingFloatRecovered === true;
    const closedAt = new Date();
    await CashSession.updateOne(
      { _id: id, ...barCashSessionFilter() },
      { $set: { status: "CLOSED", closedAt, openingFloatRecovered } }
    );
    return NextResponse.json({ ...cashSession, status: "CLOSED", closedAt, openingFloatRecovered });
  }

  if (action === "reopen") {
    if (cashSession.status === "OPEN") {
      return NextResponse.json({ error: "Cette session est déjà ouverte." }, { status: 400 });
    }

    const newest = await CashSession.findOne(barCashSessionFilter())
      .sort({ createdAt: -1, _id: -1 })
      .select("_id")
      .lean();
    if (!newest || String(newest._id) !== String(cashSession._id)) {
      return NextResponse.json(
        {
          error:
            "Seule la dernière session en date peut être relancée. Les sessions clôturées plus anciennes ne le peuvent plus.",
        },
        { status: 400 }
      );
    }

    const active = await CashSession.findOne({
      ...barCashSessionFilter(),
      status: "OPEN",
      _id: { $ne: id },
    })
      .select("_id")
      .lean();
    if (active) {
      return NextResponse.json(
        { error: "Une autre session est déjà ouverte. Clôturez-la avant de relancer celle-ci." },
        { status: 409 }
      );
    }

    await CashSession.updateOne(
      { _id: id, ...barCashSessionFilter() },
      { $set: { status: "OPEN" }, $unset: { closedAt: 1, openingFloatRecovered: 1 } }
    );
    return NextResponse.json({
      ...cashSession,
      status: "OPEN",
      closedAt: undefined,
      openingFloatRecovered: undefined,
    });
  }

  if (cashSession.status === "CLOSED") {
    return NextResponse.json({ error: "Une session clôturée ne peut pas être modifiée." }, { status: 400 });
  }

  const openingFloat = Number(body?.openingFloat);
  if (!Number.isFinite(openingFloat) || openingFloat < 0) {
    return NextResponse.json({ error: "Fond de caisse invalide." }, { status: 400 });
  }

  await CashSession.updateOne(
    { _id: id, ...barCashSessionFilter() },
    { $set: { openingFloat } }
  );
  return NextResponse.json({ ...cashSession, openingFloat });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  const cashSession = await loadBarSession(id);
  if (!cashSession) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }

  await CashSession.deleteOne({ _id: id, ...barCashSessionFilter() });
  return NextResponse.json({ message: "Session supprimée." });
}
