import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dog, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 px-4 py-12">
      <Card className="border-2 max-w-md w-full">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* İkon */}
            <div className="flex justify-center">
              <div className="bg-primary/10 p-6 rounded-full">
                <Dog className="h-16 w-16 text-primary" />
              </div>
            </div>

            {/* Başlık */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Hay aksi! Sayfa Kayıp...
              </h1>
              <p className="text-lg text-muted-foreground">
                Aradığın sayfayı bulamadık ama belki bu kayıp dostumuzu bulabilirsin.
              </p>
            </div>

            {/* Buton */}
            <Button asChild size="lg" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Ana Sayfaya Dön
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

