import { Stack } from 'expo-router';

const BRAND = { navy: '#1A2744' };

export default function NewsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BRAND.navy, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
        headerBackTitle: 'Haberler',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Haberler' }} />
      <Stack.Screen name="[id]" options={{ title: 'Haber Detayı' }} />
    </Stack>
  );
}
