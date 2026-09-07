import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES, isDirectionRole } from "@/lib/roles";
import User from "@/models/User";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const { userId } = await params;
  if (!Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const signatureUrl =
    typeof body?.signatureUrl === "string" && body.signatureUrl.trim()
      ? body.signatureUrl.trim()
      : null;

  const existing = await User.findById(userId).select("role");
  if (!existing) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  if (!isDirectionRole(existing.role)) {
    return NextResponse.json(
      { error: "Les signatures sont réservées aux rôles Directeur et Directrice" },
      { status: 400 }
    );
  }

  const user = await User.findByIdAndUpdate(
    userId,
    signatureUrl
      ? { $set: { signatureUrl } }
      : { $unset: { signatureUrl: 1 } },
    { new: true }
  )
    .select("firstName lastName email role signatureUrl isActive")
    .lean();

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    isActive: user.isActive !== false,
  });
}
