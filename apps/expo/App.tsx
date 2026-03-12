import "./global.css";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView } from "react-native";

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Gradient Area */}
        <View className="bg-orange-500 px-6 pt-12 pb-16 rounded-b-3xl">
          <View className="items-center">
            {/* Logo / Icon */}
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 shadow-lg">
              <Text className="text-4xl">🐾</Text>
            </View>
            <Text className="text-white text-3xl font-bold text-center">
              Dijital Pati
            </Text>
            <Text className="text-orange-100 text-base text-center mt-1 font-medium">
              Mobil Dünyasına Hoş Geldiniz!
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 -mt-6">
          {/* Feature Cards */}
          <View className="bg-white rounded-2xl shadow-md p-5 mb-4">
            <Text className="text-2xl mb-2">🐕</Text>
            <Text className="text-gray-900 text-lg font-semibold">
              Evcil Hayvan Profiliniz
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Tüm evcil hayvanlarınızı tek yerden yönetin.
            </Text>
          </View>

          <View className="bg-white rounded-2xl shadow-md p-5 mb-4">
            <Text className="text-2xl mb-2">🔍</Text>
            <Text className="text-gray-900 text-lg font-semibold">
              Kayıp Hayvan Takibi
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Kayıp ilanı oluşturun, toplulukla paylaşın.
            </Text>
          </View>

          <View className="bg-white rounded-2xl shadow-md p-5 mb-4">
            <Text className="text-2xl mb-2">💬</Text>
            <Text className="text-gray-900 text-lg font-semibold">
              Topluluk Forumu
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              Diğer hayvan severlerle buluşun ve paylaşın.
            </Text>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            className="bg-orange-500 py-4 rounded-2xl items-center mt-2 mb-8 shadow-md"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-bold">
              Hemen Başla →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="px-6 pb-8">
          <Text className="text-center text-gray-400 text-xs">
            Dijital Pati • Tüm hakları saklıdır
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
