"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPost } from "@/app/actions/forum";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function CreateForumPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Genel",
  });

  // Giriş kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setIsLoggedIn(true);
      } catch (err) {
        console.error("Auth check error:", err);
        router.push("/login");
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title);
      formDataObj.append("content", formData.content);
      formDataObj.append("category", formData.category);

      const result = await createPost(formDataObj);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.success) {
        setSuccess(true);
        setFormData({ title: "", content: "", category: "Genel" });

        // 2 saniye sonra forum sayfasına yönlendir
        setTimeout(() => {
          router.push("/forum");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Konu oluşturulurken bir hata oluştu.");
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Forum'a Dön
        </Link>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-3xl">Yeni Konu Aç</CardTitle>
            <CardDescription>
              Toplulukla paylaşmak istediğiniz bir konu mu var?
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2 text-sm mb-4">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <span>Konu açıldı, 10 Puan kazandın! 🎉</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Örn: Evcil hayvanım için hangi yemi tercih ediyorsunuz?"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/200 karakter
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  disabled={loading || success}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Genel">Genel</SelectItem>
                    <SelectItem value="Soru & Cevap">Soru & Cevap</SelectItem>
                    <SelectItem value="Kayıp İlanı">Kayıp İlanı</SelectItem>
                    <SelectItem value="Sağlık & Bakım">Sağlık & Bakım</SelectItem>
                    <SelectItem value="Eğitim">Eğitim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">İçerik *</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Konunuzun detaylarını buraya yazın..."
                  value={formData.content}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                  rows={12}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Detaylı açıklama yaparsanız daha iyi yanıtlar alırsınız
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading || success}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Konuyu Aç
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
