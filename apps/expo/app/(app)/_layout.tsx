import { Tabs, useRouter } from 'expo-router';
import { Home, Map, User, Settings, Search, MessageSquare, Newspaper, Bell } from 'lucide-react-native';
import { Platform, Pressable } from 'react-native';

function NotificationHeaderButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/(app)/notifications')}
      style={{ marginRight: 16 }}
      hitSlop={8}
    >
      <Bell color="#FFFFFF" size={22} strokeWidth={2.25} />
    </Pressable>
  );
}

// ─── Web-Extracted Brand Colors ───────────────────────────────────
const BRAND = {
  primary:  '#6366F1',  // Indigo-500
  navy:     '#1A2744',  // Web --primary (dark navy)
  inactive: '#94A3B8',  // Slate-400
  tabBg:    '#FFFFFF',
  tabBorder:'#E2E8F0',
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
        headerTintColor: '#FFFFFF',
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
          headerRight: () => <NotificationHeaderButton />,
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="lost-pets"
        options={{
          headerShown: false,
          title: 'Kayıplar',
          tabBarIcon: ({ color, focused }) => (
            <Search color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="forum/index"
        options={{
          title: 'Forum',
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="news/index"
        options={{
          title: 'Haberler',
          tabBarIcon: ({ color, focused }) => (
            <Newspaper color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      {/* Hidden screens — not shown in tab bar */}
      <Tabs.Screen name="map/index" options={{ href: null, title: 'Harita' }} />
      <Tabs.Screen name="settings/index" options={{ href: null, title: 'Ayarlar' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'Bildirimler' }} />
    </Tabs>
  );
}
