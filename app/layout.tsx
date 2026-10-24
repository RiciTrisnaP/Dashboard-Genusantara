import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono } from "next/font/google";
import { AppBar } from "@/components/AppBar";
import { SimulationBanner } from "@/components/SimulationBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SignOffProvider } from "@/components/SignOffProvider";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "OnkoTepat (simulasi)", template: "%s | OnkoTepat (simulasi)" },
  description: "Prototipe demo OnkoTepat x NUSA-15. Semua data simulasi, bukan untuk keputusan klinis.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${figtree.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SimulationBanner />
        <AppBar />
        <SignOffProvider>
          <main className="flex-1 print:p-0">{children}</main>
        </SignOffProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
