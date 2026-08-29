"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useAppModule } from "@/components/shared/app-module-context";
import { moduleNavItems } from "@/lib/nav";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { moduleId } = useAppModule();
  const role = session?.user?.role ?? "";

  const visibleItems = moduleNavItems(moduleId, role);
  const activeItem = visibleItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const topItems = visibleItems.slice(0, 5);
  const itemsToRender =
    activeItem && !topItems.some((item) => item.href === activeItem.href)
      ? [...topItems.slice(0, 4), activeItem]
      : topItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E5E5] safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {itemsToRender.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-150 min-w-0",
                isActive ? "text-[#0D0D0D]" : "text-[#9CA3AF]"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-[#0D0D0D]")} />
              <span className="text-[9px] font-medium truncate">{item.mobileLabel ?? item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[#0D0D0D]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
