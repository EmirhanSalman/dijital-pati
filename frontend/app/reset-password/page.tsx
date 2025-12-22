"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Dog, Key, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Handle auth code exchange on mount
  useEffect(() => {
    const exchangeCodeForSession = async () => {
      const code = searchParams.get("code");
      
      if (!code) {
        setError("Geçersiz veya eksik doğrulama kodu. Lütfen e-postanızdaki bağlantıyı kullanın.");
        setInitializing(false);
        return;
      }

      try {
        const supabase = createClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(exchangeError.message || "Oturum oluşturulurken bir hata oluştu. Lütfen bağlantıyı tekrar deneyin.");
          setInitializing(false);
          return;
        }

        setInitialized(true);
        setInitializing(false);
      } catch (err: any) {
        setError(err.message || "Beklenmeyen bir hata oluştu.");
        setInitializing(false);
      }
    };

    exchangeCodeForSession();
  }, [searchParams]);

  // Redirect to login after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000); // 3 second delay
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPasswordMismatch(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true);
      setError("Şifreler eşleşmiyor. Lütfen tekrar kontrol edin.");
      setLoading(false);
      return;
    }

    // Validate password length (Supabase requires at least 6 characters)
    if (newPassword.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Şifre güncellenirken bir hata oluştu.");
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

  // Show loading state while exchanging code
  if (initializing) {
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
              <CardTitle className="text-3xl">Şifre Sıfırla</CardTitle>
              <CardDescription>
                Doğrulama yapılıyor...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show error if initialization failed
  if (!initialized && error) {
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
              <CardTitle className="text-3xl">Şifre Sıfırla</CardTitle>
              <CardDescription>
                Doğrulama hatası
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/forgot-password">
                  Yeni Şifre Sıfırlama Bağlantısı İste
                </Link>
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Giriş Sayfasına Dön
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
            <CardTitle className="text-3xl">Şifre Sıfırla</CardTitle>
            <CardDescription>
              Yeni şifrenizi belirleyin
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
                    Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
                  </span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">
                    Giriş Sayfasına Git
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    Yeni Şifre
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordMismatch && e.target.value !== confirmPassword) {
                        setPasswordMismatch(true);
                      } else {
                        setPasswordMismatch(false);
                        setError(null);
                      }
                    }}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Yeni Şifre (Tekrar)
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordMismatch && e.target.value !== newPassword) {
                        setPasswordMismatch(true);
                      } else {
                        setPasswordMismatch(false);
                        setError(null);
                      }
                    }}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                {passwordMismatch && newPassword && confirmPassword && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Şifreler eşleşmiyor.</span>
                  </div>
                )}
                <Button 
                  className="w-full" 
                  size="lg" 
                  type="submit" 
                  disabled={loading || passwordMismatch || !newPassword || !confirmPassword || !initialized}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Şifreyi Güncelle
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Card className="border-2 w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-center text-muted-foreground">Yükleniyor...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

