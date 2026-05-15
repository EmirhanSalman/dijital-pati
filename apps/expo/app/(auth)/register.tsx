import {
  View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

// ─── Brand Palette (web-synced) ──────────────────────────────────
const C = {
  primary:     '#6366F1',  // Indigo-500
  primaryDark: '#4F46E5',  // Indigo-600
  primaryBg:   '#EEF2FF',  // Indigo-50
  navy:        '#1A2744',  // Web --primary
  foreground:  '#090E1A',
  muted:       '#64748B',
  border:      '#E2E8F0',
  surface:     '#FFFFFF',
  background:  '#F8FAFC',
  danger:      '#EF4444',
  dangerBg:    '#FEF2F2',
  success:     '#22C55E',
  successBg:   '#F0FDF4',
};

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  const validate = (): string | null => {
    if (!email.trim())    return 'E-posta adresi boş bırakılamaz.';
    if (!email.includes('@')) return 'Geçerli bir e-posta adresi girin.';
    if (password.length < 6) return 'Şifre en az 6 karakter olmalıdır.';
    if (password !== confirmPw) return 'Şifreler eşleşmiyor. Lütfen kontrol edin.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
        } else if (authError.message.includes('Password should be')) {
          setError('Şifre en az 6 karakter olmalıdır.');
        } else {
          setError(authError.message);
        }
        return;
      }

      // Supabase may require email confirmation (depends on project settings).
      // Show a success message either way — onAuthStateChange handles auto-login.
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14 }}
          style={styles.successCard}
        >
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Kayıt Başarılı!</Text>
          <Text style={styles.successBody}>
            Hesabınız oluşturuldu. E-posta onayı gerekmiyorsa uygulama sizi otomatik yönlendirecek.{'\n\n'}
            Gelen kutunuzu kontrol edin ve hesabınızı doğrulayın.
          </Text>
          <Pressable
            id="go-to-login-after-register"
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={() => router.replace('/(auth)')}
          >
            <Text style={styles.primaryBtnText}>Giriş Ekranına Dön</Text>
          </Pressable>
        </MotiView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 50 }}
          style={styles.logoBlock}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🐾</Text>
          </View>
          <Text style={styles.appName}>
            Dijital<Text style={styles.appNameAccent}>Pati</Text>
          </Text>
          <Text style={styles.tagline}>Yeni hesap oluşturun</Text>
        </MotiView>

        {/* Form Card */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 200, duration: 500 }}
          style={styles.card}
        >
          {/* Error Banner */}
          {error && (
            <MotiView
              from={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.errorBanner}
            >
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </MotiView>
          )}

          {/* Email */}
          <Text style={styles.label}>E-posta Adresi</Text>
          <TextInput
            id="register-email"
            style={styles.input}
            placeholder="ornek@email.com"
            placeholderTextColor={C.muted}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(null); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
          />

          {/* Password */}
          <Text style={styles.label}>Şifre</Text>
          <TextInput
            id="register-password"
            style={styles.input}
            placeholder="En az 6 karakter"
            placeholderTextColor={C.muted}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null); }}
            secureTextEntry={true}
            autoComplete="password-new"
            returnKeyType="next"
          />

          {/* Confirm Password */}
          <Text style={styles.label}>Şifre Tekrar</Text>
          <TextInput
            id="register-confirm-password"
            style={[
              styles.input,
              confirmPw.length > 0 && password !== confirmPw && styles.inputError,
            ]}
            placeholder="Şifrenizi tekrar girin"
            placeholderTextColor={C.muted}
            value={confirmPw}
            onChangeText={(t) => { setConfirmPw(t); setError(null); }}
            secureTextEntry={true}
            autoComplete="password-new"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
          {confirmPw.length > 0 && password !== confirmPw && (
            <Text style={styles.inlineError}>Şifreler eşleşmiyor</Text>
          )}

          {/* Submit */}
          <Pressable
            id="register-submit"
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
              loading && styles.primaryBtnDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Hesap Oluştur</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link */}
          <Pressable
            id="go-to-login"
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
            onPress={() => router.replace('/(auth)')}
          >
            <Text style={styles.secondaryBtnText}>
              Zaten hesabınız var mı? <Text style={styles.secondaryBtnAccent}>Giriş Yap</Text>
            </Text>
          </Pressable>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: C.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 48,
  },

  // ── Logo ──
  logoBlock: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoEmoji: { fontSize: 44 },
  appName: { fontSize: 30, fontWeight: '800', color: C.navy, letterSpacing: 0.5 },
  appNameAccent: { color: C.primary },
  tagline: { fontSize: 15, color: C.muted, marginTop: 6 },

  // ── Card ──
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  // ── Error ──
  errorBanner: {
    backgroundColor: C.dangerBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 13, color: C.danger, lineHeight: 18 },
  inlineError: { fontSize: 12, color: C.danger, marginTop: 4, marginLeft: 4 },

  // ── Inputs ──
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.navy,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: C.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: C.foreground,
  },
  inputError: {
    borderColor: C.danger,
    backgroundColor: C.dangerBg,
  },

  // ── Buttons ──
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnPressed: { backgroundColor: C.primaryDark, transform: [{ scale: 0.98 }] },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 13, color: C.muted },

  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  secondaryBtnPressed: { backgroundColor: C.primaryBg },
  secondaryBtnText: { fontSize: 14, color: C.muted, fontWeight: '500' },
  secondaryBtnAccent: { color: C.primary, fontWeight: '700' },

  // ── Success State ──
  successContainer: {
    flex: 1,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: C.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.navy, marginBottom: 12 },
  successBody: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
});
