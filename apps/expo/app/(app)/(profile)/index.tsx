import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../_layout';

const MENU_ITEMS = ['Evcil Hayvanlarım', 'Bağış Geçmişi', 'Cüzdanım', 'Ayarlar'];

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <StatusBar style="dark" />
      <View className="flex-1 px-5 pt-6">

        <Text className="text-2xl font-bold text-slate-800 mb-6">Profil</Text>

        {/* Avatar */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-3">
            <Text className="text-4xl">🐾</Text>
          </View>
          <Text className="text-lg font-semibold text-slate-700">Misafir Kullanıcı</Text>
          <Text className="text-xs text-slate-400 mt-1">Phase 2 — Supabase Auth</Text>
        </View>

        {/* Menu list */}
        <View className="bg-white rounded-2xl shadow-sm shadow-slate-200 overflow-hidden mb-4">
          {MENU_ITEMS.map((item, idx) => (
            <View
              key={item}
              className={`px-5 py-4 ${idx < MENU_ITEMS.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <Text className="text-slate-700 font-medium">{item}</Text>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className="bg-red-50 rounded-2xl py-4 items-center active:bg-red-100"
          activeOpacity={0.85}
          onPress={signOut}
        >
          <Text className="text-red-500 font-semibold">Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
