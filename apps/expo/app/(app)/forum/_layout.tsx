import { Stack } from 'expo-router';

const BRAND = { navy: '#1A2744' };

export default function ForumLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BRAND.navy, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
        headerBackTitle: 'Forum',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Pati Forum' }} />
      <Stack.Screen name="[id]" options={{ title: 'Konu Detayı' }} />
      <Stack.Screen name="create" options={{ title: 'Yeni Konu', presentation: 'modal' }} />
    </Stack>
  );
}
