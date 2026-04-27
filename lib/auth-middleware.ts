import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

interface AuthResult {
  session?: Session;
  error?: NextResponse;
}

export async function requireAuth(roles?: string[]): Promise<AuthResult> {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return {
      error: NextResponse.json(
        { error: "Session expirée ou invalide. Déconnectez-vous puis reconnectez-vous." },
        { status: 401 }
      ),
    };
  }

  if (!session) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  if (roles && !roles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
    };
  }

  return { session };
}
