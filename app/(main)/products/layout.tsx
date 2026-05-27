import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/get-session";

export default async function ProductsLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedServerSession();

  if (!session) {
    redirect("/login");
  }

  if (!["directeur", "directrice"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
