"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dog, UserPlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// Strong password validation regex
// Requires: min 8 chars, at least one uppercase, one lowercase, one number, one special character
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.,])[A-Za-z\d!@#$%^&*.,]{8,}$/;

// Validate password strength and return error message if invalid
function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Şifre en az 8 karakter olmalıdır.";
  }
  if (!/[a-z]/.test(password)) {
    return "Şifre en az bir küçük harf içermelidir.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Şifre en az bir büyük harf içermelidir.";
  }
  if (!/\d/.test(password)) {
    return "Şifre en az bir rakam içermelidir.";
  }
  if (!/[!@#$%^&*.,]/.test(password)) {
    return "Şifre en az bir özel karakter (!@#$%^&*.,) içermelidir.";
  }
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Trim passwords to remove any leading/trailing whitespace
    const trimmedPassword = formData.password.trim();
    const trimmedConfirmPassword = formData.confirmPassword.trim();

    // Şifre kontrolü
    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePasswordStrength(trimmedPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: trimmedPassword,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (signUpError) {
        // Provide more specific error messages
        let errorMessage = signUpError.message || "Kayıt olurken bir hata oluştu.";
        
        // Handle common Supabase auth errors
        if (signUpError.status === 400) {
          if (signUpError.message?.includes("User already registered")) {
            errorMessage = "Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.";
          } else if (signUpError.message?.includes("Password")) {
            errorMessage = "Şifre gereksinimleri karşılanmıyor. Lütfen şifre kurallarını kontrol edin.";
          } else if (signUpError.message?.includes("email")) {
            errorMessage = "Geçersiz e-posta formatı.";
          } else {
            errorMessage = `Kayıt hatası (400): ${signUpError.message}`;
          }
        } else if (signUpError.status === 429) {
          errorMessage = "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
        }
        
        console.error("Supabase auth error:", {
          status: signUpError.status,
          message: signUpError.message,
          name: signUpError.name,
        });
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        // Başarılı kayıt sonrası 2 saniye bekle ve ana sayfaya yönlendir
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Beklenmeyen bir hata oluştu.");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
            <CardTitle className="text-3xl">Kayıt Ol</CardTitle>
            <CardDescription>
              DijitalPati ailesine katılın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span>Kayıt başarılı! Yönlendiriliyorsunuz...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Ad Soyad
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-posta
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  En az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermelidir
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Şifre Tekrar
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading || success}
                />
              </div>
              <Button className="w-full" size="lg" type="submit" disabled={loading || success}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kayıt yapılıyor...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Kayıt Ol
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Giriş Yap
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


