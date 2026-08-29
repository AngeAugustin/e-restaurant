"use client";

import { Wine, CookingPot, Banknote, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useAppModule } from "@/components/shared/app-module-context";
import { type AppModuleId, visibleModules } from "@/lib/nav";

const ICONS = {
  bar: Wine,
  cuisine: CookingPot,
  paie: Banknote,
  administration: Shield,
} as const;

export function AppModuleHeader() {
  const { moduleId, setModuleId } = useAppModule();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const modules = visibleModules(role);

  if (modules.length <= 1) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E5E5] bg-white/95 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Modules de l'application"
          className="inline-flex w-full max-w-2xl rounded-xl bg-[#F5F5F5] p-1"
        >
          {modules.map((mod) => {
            const Icon = ICONS[mod.id as AppModuleId];
            const selected = moduleId === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setModuleId(mod.id)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all sm:gap-2 sm:px-3 sm:text-sm",
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-[#6B7280] hover:bg-white hover:text-[#0D0D0D]"
                )}
                aria-current={selected ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{mod.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
