import Link from "next/link";
import { Dog, Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo ve Açıklama */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Dog className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Dijital<span className="text-primary">Pati</span></span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Blockchain güvencesiyle evcil hayvanlarınızın kimliğini koruyun. 
              QR kod takip sistemi, NFT kimlik kartları ve sosyal özelliklerle 
              dostlarınızı güvende tutun.
            </p>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="font-semibold mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors">
                  Haberler
                </Link>
              </li>
              <li>
                <Link href="/forum" className="text-muted-foreground hover:text-foreground transition-colors">
                  Forum
                </Link>
              </li>
              <li>
                <Link href="/lost-pets" className="text-muted-foreground hover:text-foreground transition-colors">
                  Kayıp İlanları
                </Link>
              </li>
            </ul>
          </div>

          {/* Bilgi */}
          <div>
            <h3 className="font-semibold mb-4">Bilgi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <a href="mailto:info@dijitalpati.com" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@dijitalpati.com</span>
                </a>
              </li>
              <li className="flex space-x-4 mt-4">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {currentYear} DijitalPati. Tüm hakları saklıdır.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Gizlilik Politikası
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Kullanım Şartları
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
