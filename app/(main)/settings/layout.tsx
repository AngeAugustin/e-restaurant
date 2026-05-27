import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/get-session";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedServerSession();
  if (!["directeur", "directrice"].includes(session?.user?.role ?? "")) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
