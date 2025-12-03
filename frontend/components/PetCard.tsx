"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, Phone, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PetData } from "../utils/fetchPets";

interface PetCardProps {
  pet: PetData;
}

export default function PetCard({ pet }: PetCardProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const petUrl = typeof window !== "undefined" ? `${window.location.origin}/pet/${pet.id}` : "";

  return (
    <>
      {/* QR Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">QR Kod</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">{pet.name}</p>
              <div className="bg-white p-4 rounded-2xl inline-block border-2 border-gray-200">
                <QRCodeSVG 
                  id="qr-code-svg"
                  value={petUrl}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-400 mt-4 break-all">{petUrl}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  // SVG'yi indir
                  const svg = document.querySelector('#qr-code-svg') as SVGSVGElement;
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);
                    const link = document.createElement('a');
                    link.download = `dijital-pati-${pet.id}-qr.svg`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                QR Kod İndir
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pet Card */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Resim Alanı */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        <Image
          src={pet.image}
          alt={pet.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Durum Badge */}
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${
          pet.isLost 
            ? "bg-red-500 animate-pulse" 
            : "bg-green-500"
        }`}>
          {pet.isLost ? "🔴 KAYIP" : "✅ GÜVENDE"}
        </div>

        {/* Token ID Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-bold text-white">
          #{pet.id}
        </div>
      </div>

      {/* İçerik Alanı */}
      <div className="p-5">
        {/* İsim ve Açıklama */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
            {pet.name}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">
            {pet.description}
          </p>
        </div>

        {/* İletişim Bilgisi */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
          <Phone size={14} className="text-gray-400" />
          <span className="truncate">{pet.contactInfo || "İletişim bilgisi yok"}</span>
        </div>

        {/* Sahip Bilgisi */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <MapPin size={14} className="text-gray-400" />
          <span className="truncate font-mono">
            {pet.owner.slice(0, 6)}...{pet.owner.slice(-4)}
          </span>
        </div>

        {/* Butonlar */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"
            title="QR Kod Göster"
          >
            <QrCode size={16} />
            QR Kod
          </button>
          <Link
            href={`/pet/${pet.id}`}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
          >
            <span>Detay</span>
            <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

