import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile, getUserThreads } from "@/lib/supabase/server";
import { formatDateTR } from "@/lib/utils/date";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Award, Mail, User, LogOut, Edit, Shield, Crown, MessageSquare, PawPrint } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import Link from "next/link";
import UserThreadsTab from "@/components/profile/UserThreadsTab";
import ProfilePetsTab from "@/components/profile/ProfilePetsTab";
import WalletAddressForm from "@/components/profile/WalletAddressForm";
import AvatarUpload from "@/components/profile/AvatarUpload";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Eğer kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!user) {
    redirect("/login");
  }

  // Profil bilgilerini çek
  const profile = await getUserProfile();

  // Kullanıcının baş harflerini al
  const getUserInitials = () => {
    const fullName = profile?.full_name || user.user_metadata?.full_name || "";
    if (fullName) {
      const names = fullName.split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "KP";
  };

  // Kullanıcının görünen adını al
  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.username) return profile.username;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email;
    return "Kullanıcı";
  };

  // Kayıt tarihini formatla
  const getFormattedDate = () => {
    if (profile?.created_at) {
      return formatDateTR(profile.created_at, { year: "numeric", month: "long", day: "numeric" });
    }
    if (user.created_at) {
      return formatDateTR(user.created_at, { year: "numeric", month: "long", day: "numeric" });
    }
    return "Bilinmiyor";
  };

  // Rol badge'i
  const getRoleBadge = () => {
    const role = profile?.role || "user";
    if (role === "admin") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <User className="h-3 w-3" />
        Kullanıcı
      </Badge>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Üst Kısım - Profil Başlığı */}
        <Card className="mb-6 border-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <AvatarUpload 
                currentAvatarUrl={profile?.avatar_url}
                userInitials={getUserInitials()}
              />
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                  <CardTitle className="text-3xl md:text-4xl">{getDisplayName()}</CardTitle>
                  {getRoleBadge()}
                </div>
                {profile?.username && (
                  <CardDescription className="text-lg">@{profile.username}</CardDescription>
                )}
                {user.email && (
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Toplam Puan</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500" />
                {profile?.points || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platform üzerinde kazandığınız toplam puan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Kayıt Tarihi</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-500" />
                {getFormattedDate()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                DijitalPati ailesine katıldığınız tarih
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Rol</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-purple-500" />
                {profile?.role === "admin" ? "Admin" : "Kullanıcı"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Platformdaki yetki seviyeniz
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Yapısı */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="threads">
              <MessageSquare className="h-4 w-4 mr-2" />
              Konularım
            </TabsTrigger>
            <TabsTrigger value="pets">
              <PawPrint className="h-4 w-4 mr-2" />
              Dostlarım
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Profil */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Profil Ayarları</CardTitle>
                <CardDescription>Hesap ve profil ayarlarınızı yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Cüzdan Adresi</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Kayıp hayvan bildirimlerini alabilmek için cüzdan adresinizi kaydedin.
                  </p>
                  <WalletAddressForm currentAddress={profile?.wallet_address} />
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full md:w-auto" disabled>
                    <Edit className="h-4 w-4 mr-2" />
                    Bilgileri Düzenle
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <form action={signOut}>
                    <Button type="submit" variant="destructive" className="w-full md:w-auto">
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Konularım */}
          <TabsContent value="threads" className="mt-6">
            <UserThreadsTab userId={user.id} />
          </TabsContent>

          {/* Tab 3: Dostlarım */}
          <TabsContent value="pets" className="mt-6">
            <ProfilePetsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}