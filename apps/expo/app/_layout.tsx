import { createContext, useContext, useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

// ─── Auth Context ────────────────────────────────────────────────
type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean; // Gelecekte Supabase yükleme durumu için eklendi
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  signIn: () => { },
  signOut: () => { },
});

export const useAuth = () => useContext(AuthContext);

// ─── Auth Gate Hook ─────────────────────────────────────────────
function useAuthGate(isAuthenticated: boolean, isReady: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;

    // Hangi grupta olduğumuzu daha güvenli bir şekilde tespit edelim
    const currentSegment = String(segments?.[0] ?? '');
    const inAuthGroup = currentSegment === '(auth)';

    // 1. Kullanıcı giriş yapmamış ve (auth) grubu dışındaysa -> Girişe yolla
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    }
    // 2. Kullanıcı giriş yapmış ve (auth) grubundaysa -> Ana sayfaya yolla
    else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/(home)');
    }
  }, [segments, isAuthenticated, isReady]);
}

// ─── ROOT LAYOUT ────────────────────────────────────────────────
export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Layout'un tam olarak mount edildiğinden emin olalım
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Auth yönlendirme mantığını çalıştır
  useAuthGate(isAuthenticated, isReady);

  // Eğer layout henüz hazır değilse, hiçbir şey render etme (veya bir Splash ekranı göster)
  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <AuthContext.Provider
        value={{
          isAuthenticated,
          isLoading: false,
          signIn: () => setIsAuthenticated(true),
          signOut: () => setIsAuthenticated(false),
        }}
      >
        <Slot />
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}