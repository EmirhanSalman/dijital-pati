"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AdminNewsCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
  });

  // Admin kontrolü
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Profil bilgilerini çek
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          setIsAdmin(true);
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Admin check error:", err);
        router.push("/");
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("news")
        .insert([
          {
            title: formData.title,
            content: formData.content,
            image_url: formData.image_url || null,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setFormData({ title: "", content: "", image_url: "" });

      // 2 saniye sonra haberler listesine yönlendir
      setTimeout(() => {
        router.push("/admin/news");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Haber eklenirken bir hata oluştu.");
    } finally {
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Haber Listesine Dön
        </Link>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-3xl">Yeni Haber Ekle</CardTitle>
            <CardDescription>
              Platform için yeni bir haber veya duyuru yayınlayın
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
                <span>Haber başarıyla eklendi! Haberler listesine yönlendiriliyorsunuz...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Örn: Yeni Özellik Duyurusu"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">İçerik *</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Haber içeriğini buraya yazın..."
                  value={formData.content}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  rows={10}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Resim URL (Opsiyonel)</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Haber için görsel eklemek isterseniz bir resim URL'si girin
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yayınlanıyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Haberi Yayınla
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




