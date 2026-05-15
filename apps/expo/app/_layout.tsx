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
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  signOut: async () => {},
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
      router.replace('/(auth)');
    } else if (session && inAuthGroup) {
      router.replace('/(app)/home');
    }
  }, [session, isLoading, segments, router]);
}

// ─── ROOT LAYOUT ────────────────────────────────────────────────
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useAuthGate(session, isLoading);

  if (isLoading) return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will fire with null session → gate redirects to /(auth)
  };

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ session, isLoading, signOut: handleSignOut }}>
        <Slot />
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}