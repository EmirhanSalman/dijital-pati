import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HomePageClient from "@/components/HomePageClient";
import NewsSection from "@/components/NewsSection";

export default function Home() {
  return (
    <div className="flex flex-col">
      <HomePageClient />

      {/* News Section - Server Component */}
      <NewsSection />

      {/* CTA Section */}
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
    </div>
  );
}