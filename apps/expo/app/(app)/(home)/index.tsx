import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const STATS = [
  { value: '0', label: 'Evcil Hayvan' },
  { value: '0', label: 'Bağış (₺)' },
  { value: '0', label: 'Bildirim' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-28"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-800">Merhaba! 👋</Text>
          <Text className="text-slate-500 mt-1 text-sm">
            Bugün bir can dostuna yardım et.
          </Text>
        </View>

        {/* Quick stats */}
        <View className="flex-row gap-3 mb-6">
          {STATS.map((stat) => (
            <View
              key={stat.label}
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm shadow-slate-200"
            >
              <Text className="text-2xl font-extrabold text-primary-500">
                {stat.value}
              </Text>
              <Text className="text-xs text-slate-500 mt-1 font-medium">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Feed placeholder */}
        <View className="bg-white rounded-2xl p-5 shadow-sm shadow-slate-200">
          <Text className="text-base font-semibold text-slate-700 mb-3">
            Yakınlarındaki Hayvanlar
          </Text>
          <View className="bg-slate-50 rounded-xl py-10 items-center">
            <Text className="text-3xl mb-3">🐾</Text>
            <Text className="text-slate-400 text-sm font-medium text-center leading-relaxed">
              Harita entegrasyonu ve{'\n'}konum izni Phase 2'de ekleniyor.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
