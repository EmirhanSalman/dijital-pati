import MapPageClient from "./MapPageClient";

export const metadata = {
  title: "Kayıp Hayvan Haritası | Dijital Pati",
  description: "Kayıp evcil hayvanların konumları ve görülme bildirimleri haritası.",
};

export default function MapPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Kayıp Hayvan Haritası
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Kırmızı pinler kayıp ilanının son bilinen konumunu gösterir. Bir hayvan
            seçtiğinizde yeşil pinler görülme bildirimlerini ve izi görürsünüz.
          </p>
        </div>
        <MapPageClient />
      </div>
    </div>
  );
}
