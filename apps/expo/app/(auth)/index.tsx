import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const handleLogin = () => {
    signIn(); // Updates isAuthenticated in RootLayout → auth gate lets user through
    router.replace('/(app)/home');
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <MotiView
        from={{ opacity: 0, scale: 0.5, translateY: 50 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: 100, damping: 15 }}
        style={styles.logoContainer}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>🐾</Text>
        </View>
      </MotiView>

      {/* Texts */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 300, duration: 800 }}
        style={styles.textContainer}
      >
        <Text style={styles.title}>DigitalPati'ye</Text>
        <Text style={styles.subtitle}>Hoş Geldiniz</Text>
        <Text style={styles.description}>
          Can dostlarınızın verilerini güvenle yönetin ve takip edin.
        </Text>
      </MotiView>

      {/* Button */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 600, duration: 800 }}
        style={styles.buttonContainer}
      >
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Hemen Başla</Text>
        </Pressable>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: { marginBottom: 40 },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logoText: { fontSize: 60 },
  textContainer: { alignItems: 'center', marginBottom: 60 },
  title: { fontSize: 32, fontWeight: '800', color: '#1C1C1E', marginBottom: 5 },
  subtitle: { fontSize: 28, fontWeight: '600', color: '#FF6B00', marginBottom: 15 },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  buttonContainer: { width: '100%', paddingHorizontal: 20 },
  button: {
    backgroundColor: '#FF6B00',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonPressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
});
