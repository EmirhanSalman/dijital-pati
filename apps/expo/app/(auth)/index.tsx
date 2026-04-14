import { View, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../_layout';

export default function WelcomeScreen() {
  const { signIn } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Branding block */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-10 bg-primary-50 rounded-3xl p-6 shadow-xl shadow-primary-200/50">
          <Image
            source={require('../../assets/images/icon.png')}
            className="w-44 h-44 rounded-2xl"
            resizeMode="contain"
          />
        </View>

        <Text className="text-4xl font-extrabold text-primary-500 mb-3 text-center tracking-tight">
          Dijital Pati
        </Text>
        <Text className="text-base text-slate-500 text-center font-medium leading-relaxed px-4">
          Blokzinciri destekli{'\n'}pati dostu platformunuz.
        </Text>
      </View>

      {/* CTA buttons */}
      <View className="px-6 pb-10 gap-3">
        <TouchableOpacity
          className="bg-primary-500 w-full py-4 rounded-2xl items-center shadow-lg shadow-primary-500/30 active:bg-primary-600"
          activeOpacity={0.85}
          onPress={signIn}
        >
          <Text className="text-white text-lg font-bold tracking-wide">
            Giriş Yap
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full py-4 rounded-2xl items-center border border-primary-200 active:bg-primary-50"
          activeOpacity={0.85}
        >
          <Text className="text-primary-500 text-lg font-semibold">
            Kayıt Ol
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
