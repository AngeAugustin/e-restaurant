import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { DEFAULT_SOLUTION_NAME } from "@/lib/app-settings";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={aptos.variable}>
      <body className="font-sans antialiased bg-white">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
