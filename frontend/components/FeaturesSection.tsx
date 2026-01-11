"use client";

import { motion } from "framer-motion";
import { Shield, MapPin, Zap, Trophy, Wallet, Database, Cpu } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  delay?: number;
}

const FeatureCard = ({ title, description, icon, className = "", delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className={`group relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden ${className}`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl border border-blue-500/0 group-hover:border-blue-500/50 transition-all duration-500" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 transition-all duration-300">
            <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
              {icon}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-lg leading-relaxed group-hover:text-slate-300 transition-colors">
          {description}
        </p>
      </div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-[shimmer_3s_infinite]" />
      </div>
    </motion.div>
  );
};

export default function FeaturesSection() {
  const features = [
    {
      title: "NFT Tabanlı Kimlik",
      description: "Evcil hayvanınızın kimliği Blockchain üzerinde sonsuza kadar güvende.",
      icon: <Shield className="h-7 w-7" />,
      className: "col-span-1 md:col-span-2",
      delay: 0.1,
    },
    {
      title: "Akıllı Kayıp Alarmı",
      description: "QR kod tarandığı an GPS konumu cebinize gelsin.",
      icon: <MapPin className="h-7 w-7" />,
      className: "col-span-1 md:row-span-2",
      delay: 0.2,
    },
    {
      title: "Hibrit Teknoloji",
      description: "Web3 güvenliği ve Web2 hızı bir arada.",
      icon: (
        <div className="flex gap-2">
          <Database className="h-7 w-7" />
          <Cpu className="h-7 w-7" />
        </div>
      ),
      className: "col-span-1",
      delay: 0.3,
    },
    {
      title: "Topluluk Puanları",
      description: "Kayıp vakalarına yardım edin, ödül kazanın.",
      icon: <Trophy className="h-7 w-7" />,
      className: "col-span-1",
      delay: 0.4,
    },
  ];

  return (
    <section className="relative w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20 md:py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Güçlü <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Özellikler</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Modern teknoloji ile evcil hayvanlarınızın güvenliğini en üst seviyeye çıkarın
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              className={feature.className}
              delay={feature.delay}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400 text-lg">
            Tüm özelliklerle evcil hayvanınızı{" "}
            <span className="text-blue-400 font-semibold">güvende tutun</span>
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  );
}




