"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Dog, Wallet, LogIn, UserPlus, LogOut, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/app/actions/auth";
import type { UserProfile } from "@/lib/supabase/server";

interface NavbarClientProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  } | null;
  userScore?: number;
  profile?: UserProfile | null;
  isAdmin?: boolean;
  notificationBell?: React.ReactNode;
}

export default function NavbarClient({
  user,
  userScore = 0,
  profile,
  isAdmin = false,
  notificationBell,
}: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isLoggedIn = !!user;

  const navLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/news", label: "Haberler" },
    { href: "/forum", label: "Forum" },
    { href: "/lost-pets", label: "Kayıp İlanları" },
  ];

  // Kullanıcının baş harflerini al
  const getUserInitials = () => {
    if (!user) return "KP";
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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Dog className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Dijital<span className="text-primary">Pati</span></span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              {notificationBell}
              <Button variant="default" size="sm" asChild>
                <Link href="/create-pet">
                  <Plus className="h-4 w-4 mr-2" />
                  Evcil Hayvan Ekle
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Cüzdan Bağla
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <Avatar className="h-8 w-8">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={getDisplayName()} />
                      )}
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Puan: {userScore}</span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {getDisplayName()}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profil</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="h-4 w-4 mr-2" />
                          Yönetim Paneli
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Giriş Yap
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Kayıt Ol
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center space-x-2">
                  <Dog className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">Dijital<span className="text-primary">Pati</span></span>
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t space-y-2">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar>
                        {profile?.avatar_url && (
                          <AvatarImage src={profile.avatar_url} alt={getDisplayName()} />
                        )}
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getDisplayName()}</p>
                        <p className="text-xs text-muted-foreground">Puan: {userScore}</p>
                      </div>
                      {notificationBell && (
                        <div onClick={() => setIsOpen(false)}>
                          {notificationBell}
                        </div>
                      )}
                    </div>
                    <Button variant="default" className="w-full" asChild>
                      <Link href="/create-pet" onClick={() => setIsOpen(false)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Evcil Hayvan Ekle
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/wallet" onClick={() => setIsOpen(false)}>
                        <Wallet className="h-4 w-4 mr-2" />
                        Cüzdan Bağla
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/profile" onClick={() => setIsOpen(false)}>
                        Profil
                      </Link>
                    </Button>
                    {profile?.role === 'admin' && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Yönetim Paneli
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Giriş Yap
                      </Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Kayıt Ol
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
