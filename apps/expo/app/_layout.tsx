import { createContext, useContext, useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import '../global.css';

// ─── Auth Context ────────────────────────────────────────────────
type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

// ─── Auth Gate Hook ──────────────────────────────────────────────
function useAuthGate(session: Session | null, isLoading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = String(segments?.[0] ?? '') === '(auth)';

    if (!session && !inAuthGroup) {
      // No session → send to login
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      // Has session but on auth screen → send home
      router.replace('/(app)/home');
    }
  }, [session, isLoading, segments, router]);
}

// ─── ROOT LAYOUT ────────────────────────────────────────────────
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Restore persisted session on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // 2. Listen to all future auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Run the auth gate routing logic
  useAuthGate(session, isLoading);

  // Render nothing until we know the auth state (prevents flash)
  if (isLoading) return null;

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ session, isLoading }}>
        <Slot />
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}