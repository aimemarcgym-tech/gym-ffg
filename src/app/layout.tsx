import type { Metadata, Viewport } from "next";
import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestion Compétitions & Entraînements",
  description: "Suivi des gymnastes, mouvements et compétitions FFG",
  icons: { icon: "/favicon.ico", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "FFG Gestion", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0a0a10" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
