import { createClient } from "@/lib/supabase/server";
import { getUserProfile, isAdmin } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";
import NotificationBellWrapper from "./NotificationBellWrapper";
import { Suspense } from "react";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Profil bilgilerini veritabanından çek
  const profile = user ? await getUserProfile() : null;
  const userScore = profile?.points || 0;
  const userIsAdmin = await isAdmin();

  return (
    <NavbarClient
      user={user}
      userScore={userScore}
      profile={profile}
      isAdmin={userIsAdmin}
      notificationBell={
        <Suspense fallback={null}>
          <NotificationBellWrapper />
        </Suspense>
      }
    />
  );
}