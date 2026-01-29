import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NextTopLoader from "nextjs-toploader";
import LazyGlobalComponents from "@/components/LazyGlobalComponents";

/* Lazy load below-the-fold Footer (ssr: true is allowed in Server Components) */
const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: true,
  loading: () => (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="h-32 bg-slate-100/30 animate-pulse rounded" />
      </div>
    </footer>
  ),
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "DijitalPati - Blockchain Evcil Hayvan Takip Sistemi",
  description: "Evcil dostlarınızı blockchain güvencesiyle koruyun. QR kod takip, NFT kimlik kartları ve sosyal özellikler.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={outfit.className}>
        <NextTopLoader
          color="hsl(var(--primary))"
          showSpinner={false}
          height={3}
        />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <LazyGlobalComponents />
      </body>
    </html>
  );
}