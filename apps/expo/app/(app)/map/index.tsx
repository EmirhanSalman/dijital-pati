import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-5 pt-6 pb-4">
        <Text className="text-2xl font-bold text-slate-800">Harita</Text>
        <Text className="text-slate-500 mt-1 text-sm">
          Yakınındaki sokak hayvanları
        </Text>
      </View>

      {/* Map placeholder */}
      <View className="flex-1 mx-5 mb-28 bg-white rounded-2xl shadow-sm shadow-slate-200 items-center justify-center">
        <View className="w-20 h-20 bg-primary-50 rounded-full items-center justify-center mb-4">
          <Text className="text-4xl">🗺️</Text>
        </View>
        <Text className="text-lg font-semibold text-slate-700 mb-2">
          Harita Yakında
        </Text>
        <Text className="text-sm text-slate-400 text-center leading-relaxed px-8">
          react-native-maps + expo-location{'\n'}
          gerçek zamanlı bildirimi Phase 2'de geliyor.
        </Text>
      </View>
    </SafeAreaView>
  );
}
