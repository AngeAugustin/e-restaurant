import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(["directeur", "directrice"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  if (body?.action === "deactivate" || body?.action === "activate") {
    const isActive = body.action === "activate";

    if (id === session!.user.id && !isActive) {
      return NextResponse.json({ error: "Impossible de désactiver votre propre compte" }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const updateResult = await User.collection.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { isActive } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const updated = await User.findById(id).select("-password").lean();
    if (!updated) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      isActive,
    });
  }

  const { firstName, lastName, email, password, phone, address, role } = body;

  const updateData: Record<string, unknown> = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email.toLowerCase();
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (role) updateData.role = role;
  if (password) updateData.password = await bcrypt.hash(password, 12);

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    ...user.toObject(),
    isActive: user.isActive !== false,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(["directeur"]);
  if (error) return error;

  await connectDB();
  const { id } = await params;

  if (id === session!.user.id) {
    return NextResponse.json({ error: "Impossible de supprimer votre propre compte" }, { status: 400 });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  return NextResponse.json({ message: "Utilisateur supprimé" });
}