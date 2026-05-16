import { Stack } from 'expo-router';
import { BRAND } from '../../../lib/brand';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BRAND.navy, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
        headerBackTitle: 'Profil',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Profil', headerBackVisible: false }} />
      <Stack.Screen name="edit" options={{ title: 'Profili Düzenle' }} />
      <Stack.Screen name="my-pets" options={{ headerShown: false }} />
    </Stack>
  );
}
