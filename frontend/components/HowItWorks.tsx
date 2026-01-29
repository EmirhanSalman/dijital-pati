"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";

import storyParkImg from "@/public/images/story-park.png";

interface StepProps {
  number: number;
  title: string;
  description: string;
  index: number;
}

const StepCard = ({ number, title, description, index }: StepProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px",
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
      transition={{
        duration: 0.6,
        delay: index * 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="mb-8 last:mb-0"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex gap-6 items-start">
          {/* Step Number */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{number}</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 pt-2">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
              {title}
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Dijital Kimlik Oluştur",
      description:
        "Evcil hayvanın için Blockchain üzerinde değiştirilemez bir NFT kimliği oluştur.",
    },
    {
      number: 2,
      title: "QR Kodu Eşleştir",
      description:
        "Sana özel üretilen QR kodu tasmaya tak. Artık dostun dijital dünyada da kayıtlı.",
    },
    {
      number: 3,
      title: "Güvende Kal",
      description:
        "Kaybolma durumunda QR kodu taratan kişi anında konum paylaşır ve sana ulaşır.",
    },
  ];

  return (
    <section className="relative w-full bg-slate-50 py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Side - Sticky Image (Desktop) */}
          <div className="hidden lg:block lg:sticky lg:top-32 lg:self-start w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="relative w-full h-[500px] min-h-[400px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src={storyParkImg}
                alt="Nasıl Çalışır"
                fill
                className="object-cover rounded-2xl shadow-2xl"
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={85}
                priority
              />
              {/* Overlay gradient for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
            </motion.div>
          </div>

          {/* Mobile Image */}
          <div className="lg:hidden mb-12 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="relative w-full h-[400px] min-h-[320px] rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto"
            >
              <Image
                src={storyParkImg}
                alt="Nasıl Çalışır"
                fill
                className="object-cover rounded-2xl shadow-2xl"
                sizes="(max-width: 768px) 100vw, 768px"
                quality={85}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
            </motion.div>
          </div>

          {/* Right Side - Steps */}
          <div className="flex flex-col justify-center">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                Nasıl Çalışır?
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                DijitalPati ile evcil hayvanınızın güvenliği için 3 basit adım
              </p>
            </motion.div>

            {/* Steps List */}
            <div className="space-y-8">
              {steps.map((step, index) => (
                <StepCard
                  key={step.number}
                  number={step.number}
                  title={step.title}
                  description={step.description}
                  index={index}
                />
              ))}
            </div>

            {/* Call to Action (Optional) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="mt-12 p-6 bg-white rounded-xl shadow-lg border border-slate-200"
            >
              <p className="text-slate-700 text-center">
                <span className="font-semibold text-slate-800">
                  Hemen başla
                </span>{" "}
                ve evcil hayvanınızın dijital kimliğini oluşturun.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

