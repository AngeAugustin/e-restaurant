"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { defaultHomeHrefForRole, isPathAllowedForRole } from "@/lib/route-access";

export function RouteAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? "";

  useEffect(() => {
    if (status !== "authenticated" || !role) return;
    if (!isPathAllowedForRole(pathname, role)) {
      router.replace(defaultHomeHrefForRole(role));
    }
  }, [pathname, role, router, status]);

  return children;
}
