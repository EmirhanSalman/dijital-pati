"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dog, Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || "Şifre sıfırlama e-postası gönderilirken bir hata oluştu.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Dog className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Şifremi Unuttum</CardTitle>
            <CardDescription>
              E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. 
                    Lütfen e-postanızı kontrol edin.
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    E-postayı bulamadınız mı? Spam klasörünü kontrol edin.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">
                      Giriş Sayfasına Dön
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-posta
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button className="w-full" size="lg" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Şifre Sıfırlama Bağlantısı Gönder
                    </>
                  )}
                </Button>
              </form>
            )}

            {!success && (
              <div className="text-center text-sm text-muted-foreground">
                Şifrenizi hatırladınız mı?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Giriş Yap
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}



