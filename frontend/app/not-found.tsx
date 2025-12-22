import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <FileQuestion className="h-24 w-24 text-muted-foreground/50" />
      <h1 className="text-3xl font-bold mt-6">Eyvah! Bu Sayfa Kayıp...</h1>
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        Aradığın sayfayı bulamadık. Tıpkı sevimli bir pati gibi kaybolmuş olabilir.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  );
}
