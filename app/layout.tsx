import type { Metadata } from "next";
import localFont from "next/font/local";
import { unstable_cache } from "next/cache";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SOLUTION_NAME,
  DEFAULT_FONT_SIZE_SCALE,
  GLOBAL_SETTINGS_KEY,
  PRIMARY_THEME_CACHE_TAG,
  hexToHslTriplet,
  normalizeHexColor,
  normalizeFontSizeScale,
  rootFontSizePx,
} from "@/lib/app-settings";
import { connectDB } from "@/lib/db";
import AppSetting from "@/models/AppSetting";

const aptos = localFont({
  src: [
    {
      path: "../public/Aptos/Aptos-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/Aptos/Aptos-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aptos",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${DEFAULT_SOLUTION_NAME} — Gestion Restaurant`,
  description: "Système de gestion des stocks et des ventes pour restaurant",
  icons: {
    icon: [{ url: "/Logo.png", type: "image/png" }],
    apple: [{ url: "/Logo.png", type: "image/png" }],
  },
};

type ThemeCssVars = Omit<React.CSSProperties, "fontSize"> & Record<`--${string}`, string> & {
  fontSize: string;
};

const defaultThemeCssVars: ThemeCssVars = {
  "--primary": "0 0% 5%",
  "--ring": "0 0% 5%",
  fontSize: `${rootFontSizePx(DEFAULT_FONT_SIZE_SCALE)}px`,
};

async function loadPrimaryThemeCssVarsFromDB(): Promise<ThemeCssVars> {
  try {
    await connectDB();
    const settings = await AppSetting.findOne({ key: GLOBAL_SETTINGS_KEY })
      .select("primaryColor fontSizeScale")
      .lean();
    const primaryColor = normalizeHexColor(settings?.primaryColor) ?? DEFAULT_PRIMARY_COLOR;
    const hslTriplet = hexToHslTriplet(primaryColor) ?? "0 0% 5%";
    const fontSizeScale = normalizeFontSizeScale(settings?.fontSizeScale);
    return {
      "--primary": hslTriplet,
      "--ring": hslTriplet,
      fontSize: `${rootFontSizePx(fontSizeScale)}px`,
    };
  } catch {
    return defaultThemeCssVars;
  }
}

const getCachedPrimaryThemeCssVars = unstable_cache(loadPrimaryThemeCssVarsFromDB, ["root-layout-primary-theme"], {
  revalidate: 3600,
  tags: [PRIMARY_THEME_CACHE_TAG],
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialThemeVars = await getCachedPrimaryThemeCssVars();
  return (
    <html lang="fr" className={aptos.variable} style={initialThemeVars}>
      <body className="font-sans antialiased bg-white">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
