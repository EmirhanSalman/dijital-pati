import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sayfa Bulunamadı</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Forum post creation page not found
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
}


