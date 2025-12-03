import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { PetData } from "../utils/fetchPets";

interface PetCardProps {
  pet: PetData;
}

export default function PetCard({ pet }: PetCardProps) {
  return (
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

        {/* Detay Linki */}
        <Link
          href={`/pet/${pet.id}`}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
        >
          <span>Detayları Gör</span>
          <ExternalLink size={16} />
        </Link>
      </div>
    </div>
  );
}

