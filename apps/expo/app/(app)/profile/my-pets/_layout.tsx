import { Stack } from 'expo-router';
import { BRAND } from '../../../../lib/brand';

export default function MyPetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BRAND.navy, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: 0.3 },
        headerBackTitle: 'Hayvanlarım',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Evcil Hayvanlarım' }} />
      <Stack.Screen name="new" options={{ title: 'Evcil Hayvan Ekle' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Hayvanı Düzenle' }} />
    </Stack>
  );
}
