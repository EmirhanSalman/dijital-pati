import Link from "next/link";
import { Dog, QrCode, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      {/* Logo ve İkon */}
      <div className="bg-blue-100 p-4 rounded-full mb-6 animate-bounce">
        <Dog size={64} className="text-blue-600" />
      </div>

      {/* Başlık */}
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-blue-900">
        Dijital<span className="text-blue-600">Pati</span>
      </h1>
      
      <p className="text-xl text-gray-600 mb-10 max-w-lg">
        Blockchain tabanlı evcil hayvan kimlik ve kayıp takip sistemi.
        Dostlarınız güvende, içiniz rahat olsun.
      </p>

      {/* Butonlar */}
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
        
        {/* Kayıt Butonu */}
        <Link href="/admin" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
          <ShieldCheck size={24} />
          <span className="font-semibold">Evcil Hayvan Kayıt</span>
        </Link>

        {/* Bulan Kişi Butonu (Finder) */}
        {/* Not: Bu link normalde QR kod ile çalışacak ama test için buraya koyuyoruz */}
        <Link href="/finder-test" className="flex-1 bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-100 p-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md">
          <QrCode size={24} />
          <span className="font-semibold">Hayvan Buldum</span>
        </Link>

      </div>

      <footer className="mt-20 text-gray-400 text-sm">
        Blockchain: Polygon Testnet | Teknoloji: Next.js & Solidity
      </footer>
    </main>
  );
}