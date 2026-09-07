import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-middleware";
import { DIRECTION_ROLES } from "@/lib/roles";
import User from "@/models/User";

export async function GET() {
  const { error } = await requireAuth([...DIRECTION_ROLES]);
  if (error) return error;

  await connectDB();
  const users = await User.find({ role: { $in: [...DIRECTION_ROLES] } })
    .select("firstName lastName email role signatureUrl isActive")
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      isActive: u.isActive !== false,
    }))
  );
}
