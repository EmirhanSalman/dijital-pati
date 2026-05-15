import { Tabs } from 'expo-router';
import { Home, Map, User, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';

// ─── Web-Extracted Brand Colors ───────────────────────────────────
// Source: apps/next/app/globals.css + scrollbar accent
// --primary (navy):  #1A2744  (hsl 222.2 47.4% 11.2%)
// Brand accent:      #6366F1  (Indigo-500 — used as web scrollbar/ring color)
// --background:      #FFFFFF
// --border:          #E2E8F0  (hsl 214.3 31.8% 91.4%)
// --muted-foreground:#64748B  (hsl 215.4 16.3% 46.9%)

const BRAND = {
  primary: '#6366F1',    // Indigo-500 — web accent / scrollbar
  primaryDark: '#4F46E5', // Indigo-600
  navy: '#1A2744',       // Web --primary (dark navy)
  navyDark: '#090E1A',   // Web --foreground
  inactive: '#94A3B8',   // Slate-400
  tabBg: '#FFFFFF',      // Web --background
  tabBorder: '#E2E8F0',  // Web --border
  headerText: '#FFFFFF',
};

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND.primary,
        tabBarInactiveTintColor: BRAND.inactive,
        tabBarStyle: {
          backgroundColor: BRAND.tabBg,
          borderTopWidth: 1,
          borderTopColor: BRAND.tabBorder,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#1A2744',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: BRAND.navy,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: BRAND.headerText,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <Home
              color={color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map/index"
        options={{
          title: 'Harita',
          tabBarIcon: ({ color, focused }) => (
            <Map
              color={color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <User
              color={color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, focused }) => (
            <Settings
              color={color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}
