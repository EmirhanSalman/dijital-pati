import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // CSS BURADAN ÇAĞRILIYOR

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DijitalPati",
  description: "Blockchain Evcil Hayvan Takip Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}