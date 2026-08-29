import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  TruckIcon,
  ShoppingCart,
  Wallet,
  Users,
  UserRound,
  Table2,
  BarChart3,
  Settings2,
  BookOpen,
  CookingPot,
  ChefHat,
  UtensilsCrossed,
  CreditCard,
  Banknote,
  Landmark,
  CircleDollarSign,
  Wine,
  Shield,
  Calculator,
} from "lucide-react";

export type AppModuleId = "bar" | "cuisine" | "paie" | "administration";
export type NavModule = AppModuleId;

export type AppNavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  roles: string[];
  module: NavModule;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", mobileLabel: "Tableau", icon: LayoutDashboard, roles: ["directeur", "directrice", "gerant"], module: "bar" },
  { href: "/products", label: "Produits", icon: Package, roles: ["directeur", "directrice"], module: "bar" },
  { href: "/supplies", label: "Approvisionnements", mobileLabel: "Stock", icon: TruckIcon, roles: ["directeur", "directrice", "gerant"], module: "bar" },
  { href: "/sales", label: "Ventes", icon: ShoppingCart, roles: ["directeur", "directrice", "gerant"], module: "bar" },
  { href: "/cash", label: "Caisse", icon: Wallet, roles: ["directeur", "directrice", "gerant"], module: "bar" },
  { href: "/waitresses", label: "Serveuses", icon: UserRound, roles: ["directeur", "directrice"], module: "bar" },
  { href: "/tables", label: "Tables", icon: Table2, roles: ["directeur", "directrice"], module: "bar" },
  { href: "/analytics", label: "Analytiques", mobileLabel: "Stats", icon: BarChart3, roles: ["directeur", "directrice"], module: "bar" },

  { href: "/kitchen", label: "Commandes", mobileLabel: "Cuisine", icon: CookingPot, roles: ["directeur", "directrice", "gerant"], module: "cuisine" },
  { href: "/kitchen-cash", label: "Caisse cuisine", icon: CircleDollarSign, roles: ["directeur", "directrice", "gerant"], module: "cuisine" },
  { href: "/menus", label: "Menus", icon: UtensilsCrossed, roles: ["directeur", "directrice"], module: "cuisine" },
  { href: "/cooks", label: "Cuisinières", icon: ChefHat, roles: ["directeur", "directrice"], module: "cuisine" },
  { href: "/kitchen-plates", label: "Plaquettes", icon: CreditCard, roles: ["directeur", "directrice"], module: "cuisine" },

  { href: "/accounting", label: "Comptabilité", mobileLabel: "Compta", icon: Calculator, roles: ["directeur", "directrice", "gerant"], module: "paie" },
  { href: "/payroll", label: "Paie", icon: Banknote, roles: ["directeur", "directrice"], module: "paie" },
  { href: "/expenses", label: "Dépenses", icon: Landmark, roles: ["directeur", "directrice", "gerant"], module: "paie" },

  { href: "/users", label: "Utilisateurs", mobileLabel: "Équipe", icon: Users, roles: ["directeur", "directrice"], module: "administration" },
  { href: "/settings", label: "Paramètres", mobileLabel: "Réglages", icon: Settings2, roles: ["directeur", "directrice"], module: "administration" },
  { href: "/guide", label: "Guide", icon: BookOpen, roles: ["directeur", "directrice", "gerant"], module: "administration" },
];

export const APP_MODULES: {
  id: AppModuleId;
  label: string;
  icon: LucideIcon;
  homeHref: string;
  gerantHomeHref?: string;
}[] = [
  { id: "bar", label: "Bar", icon: Wine, homeHref: "/dashboard" },
  { id: "cuisine", label: "Cuisine", icon: CookingPot, homeHref: "/kitchen" },
  { id: "paie", label: "Paie", icon: Banknote, homeHref: "/accounting", gerantHomeHref: "/accounting" },
  { id: "administration", label: "Administration", icon: Shield, homeHref: "/users", gerantHomeHref: "/guide" },
];

const PATH_PREFIXES: { prefix: string; module: AppModuleId }[] = [
  { prefix: "/dashboard", module: "bar" },
  { prefix: "/products", module: "bar" },
  { prefix: "/supplies", module: "bar" },
  { prefix: "/sales", module: "bar" },
  { prefix: "/cash", module: "bar" },
  { prefix: "/waitresses", module: "bar" },
  { prefix: "/tables", module: "bar" },
  { prefix: "/analytics", module: "bar" },
  { prefix: "/kitchen-cash", module: "cuisine" },
  { prefix: "/kitchen-plates", module: "cuisine" },
  { prefix: "/kitchen", module: "cuisine" },
  { prefix: "/menus", module: "cuisine" },
  { prefix: "/cooks", module: "cuisine" },
  { prefix: "/accounting", module: "paie" },
  { prefix: "/payroll", module: "paie" },
  { prefix: "/expenses", module: "paie" },
  { prefix: "/users", module: "administration" },
  { prefix: "/settings", module: "administration" },
  { prefix: "/guide", module: "administration" },
];

export function moduleFromPathname(pathname: string): AppModuleId | null {
  const match = PATH_PREFIXES.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );
  return match?.module ?? null;
}

export function moduleHomeHref(moduleId: AppModuleId, role: string): string {
  const mod = APP_MODULES.find((m) => m.id === moduleId);
  if (!mod) return "/dashboard";
  if (role === "gerant" && mod.gerantHomeHref) return mod.gerantHomeHref;
  return mod.homeHref;
}

export function moduleNavItems(moduleId: AppModuleId, role: string): AppNavItem[] {
  return APP_NAV_ITEMS.filter((item) => item.roles.includes(role) && item.module === moduleId);
}

export function visibleModules(role: string): typeof APP_MODULES {
  return APP_MODULES.filter((mod) => moduleNavItems(mod.id, role).length > 0);
}
