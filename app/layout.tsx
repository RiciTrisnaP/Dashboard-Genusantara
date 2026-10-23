import type { Metadata } from "next";
import Link from "next/link";
import { SimulationBanner } from "@/components/SimulationBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SignOffProvider } from "@/components/SignOffProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OnkoTepat (simulasi)", template: "%s | OnkoTepat (simulasi)" },
  description: "Prototipe demo OnkoTepat x NUSA-15. Semua data simulasi, bukan untuk keputusan klinis.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <SimulationBanner />
        <header className="border-b border-slate-200 bg-white print:hidden">
          <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-brand-700">OnkoTepat</span>
              <span className="text-sm text-slate-500">tepat obatnya, tuntas terapinya</span>
            </Link>
            <nav className="text-sm">
              <Link href="/" className="font-medium text-slate-700 hover:text-brand-700">
                Daftar Pasien
              </Link>
            </nav>
          </div>
        </header>
        <SignOffProvider>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 print:max-w-none print:p-0">{children}</main>
        </SignOffProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
