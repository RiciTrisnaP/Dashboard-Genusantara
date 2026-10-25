import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono } from "next/font/google";
import { AppBar } from "@/components/AppBar";
import { SiteFooter } from "@/components/SiteFooter";
import { NavigatorProvider } from "@/components/navigator/NavigatorProvider";
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
  title: { default: "Genusa (simulasi)", template: "%s | Genusa (simulasi)" },
  description: "Prototipe demo Genusa dengan panel NUSA11. Semua data simulasi, bukan untuk keputusan klinis.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${figtree.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AppBar />
        <SignOffProvider>
          <NavigatorProvider>
            <main className="flex-1 print:p-0">{children}</main>
          </NavigatorProvider>
        </SignOffProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
