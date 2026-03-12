import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HomePageClient from "@/components/HomePageClient";

/* Lazy load below-the-fold sections to reduce initial JS and improve LCP */
const HowItWorks = dynamic(() => import("@/components/HowItWorks"), {
  loading: () => (
    <section className="relative w-full bg-slate-50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="h-[500px] rounded-2xl bg-slate-200/50 animate-pulse" />
          <div className="space-y-6">
            <div className="h-10 w-3/4 bg-slate-200/50 rounded animate-pulse" />
            <div className="h-6 w-full bg-slate-200/50 rounded animate-pulse" />
            <div className="h-24 w-full bg-slate-200/50 rounded animate-pulse" />
            <div className="h-24 w-full bg-slate-200/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  ),
  ssr: true,
});

const FeaturesSection = dynamic(() => import("@/components/FeaturesSection"), {
  loading: () => (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="h-12 w-64 mx-auto mb-16 bg-slate-200/50 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-200/50 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  ),
  ssr: true,
});

const NewsSection = dynamic(() => import("@/components/NewsSection"), {
  loading: () => (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="h-12 w-48 mx-auto mb-16 bg-slate-200/50 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-lg bg-slate-200/50 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  ),
  ssr: true,
});

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <HomePageClient />

      <HowItWorks />

      <FeaturesSection />

      <NewsSection />

      {/* CTA Section - lightweight, no lazy load */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-purple-100/50 to-blue-100/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Hemen Katıl, Dostlarınızı Koruyun
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Binlerce evcil hayvan sahibiyle birlikte güvenli bir topluluk oluşturuyoruz.
              Siz de aramıza katılın!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/register">
                  Ücretsiz Kayıt Ol
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="/forum">
                  Forumu Keşfet
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}