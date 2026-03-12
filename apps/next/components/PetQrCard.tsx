"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface PetQrCardProps {
  petId?: string | number;
  petImage?: string;
  petUrl?: string;
  className?: string;
  isLost?: boolean;
  petName?: string;
}

export default function PetQrCard({
  petId = "12345",
  petImage = "/images/dog-qr.jpg",
  petUrl,
  className = "",
  isLost = false,
  petName,
}: PetQrCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Generate the URL for QR code
  const qrUrl = petUrl || `https://dijitalpati.com/pet/${petId}`;

  return (
    <div
      className={`perspective-1000 group ${className}`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Front Side */}
        <motion.div
          className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-lg bg-white border-2 border-gray-200"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          <div className="relative w-full h-full p-6 flex flex-col items-center justify-center">
            {/* Status Badge */}
            <div
              className={`absolute top-4 right-4 px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 z-10 ${
                isLost
                  ? "bg-rose-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              {isLost ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  KAYIP
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  GÜVENDE
                </>
              )}
            </div>

            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 shadow-lg">
              <Image
                src={petImage}
                alt="Pet ID Card"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-800">DijitalPati</h3>
              <p className="text-sm text-gray-600">Evcil Hayvan Kimlik Kartı</p>
              {petName && (
                <p className="text-base font-semibold text-gray-800">{petName}</p>
              )}
              <p className="text-xs text-gray-500">ID: #{petId}</p>
            </div>
            <div className="mt-4 text-xs text-gray-400 text-center">
              Kartın arkasına bakmak için üzerine gelin
            </div>
          </div>
        </motion.div>

        {/* Back Side */}
        <motion.div
          className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-lg bg-white border-2 border-gray-200"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="relative w-full h-full p-6 flex flex-col items-center justify-center">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-1">QR Kod</h3>
              <p className="text-xs text-gray-500">DijitalPati Platform</p>
            </div>
            
            <div className="relative w-64 h-64 bg-white p-4 rounded-xl shadow-inner flex items-center justify-center">
              <QRCodeSVG
                value={qrUrl}
                size={224}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            <div className="mt-4 text-center space-y-1">
              <p className="text-xs text-gray-600 font-medium">Taramak için QR kodu okutun</p>
              <p className="text-xs text-gray-400 break-all px-2">{qrUrl}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
