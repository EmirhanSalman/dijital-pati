import { getNotifications } from "@/lib/supabase/server";
import NotificationBell from "./NotificationBell";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationBellWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const notifications = await getNotifications(user.id, 10);

  return <NotificationBell notifications={notifications} />;
}

