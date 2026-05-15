import { ScrollView, View, Text, Pressable, Switch, StyleSheet, Alert } from 'react-native';
import { MotiView } from 'moti';
import { useState } from 'react';
import { useAuth } from '../../_layout';
import { useRouter } from 'expo-router';

const C = {
  primary:    '#6366F1',
  primaryBg:  '#EEF2FF',
  navy:       '#1A2744',
  foreground: '#090E1A',
  muted:      '#64748B',
  border:     '#E2E8F0',
  surface:    '#FFFFFF',
  background: '#F8FAFC',
  danger:     '#EF4444',
  dangerBg:   '#FEF2F2',
};

// "Yakında" badge rendered inline next to unimplemented items
function YakindaBadge() {
  return (
    <View style={styles.yakindaBadge}>
      <Text style={styles.yakindaText}>Yakında</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);

  const userEmail = session?.user?.email ?? 'Giriş yapılmadı';

  const SECTIONS = [
    {
      title: 'Hesap',
      items: [
        { emoji: '📧', label: 'E-posta Adresi', value: userEmail, tappable: false },
        { emoji: '📱', label: 'Telefon',         value: '—',       tappable: false, comingSoon: true },
        { emoji: '🌍', label: 'Dil',             value: 'Türkçe',  tappable: false },
      ],
    },
    {
      title: 'Uygulama',
      items: [
        { emoji: '📍', label: 'Konum İzni',  value: 'Açık',   tappable: false, comingSoon: true },
        { emoji: '📷', label: 'Kamera İzni', value: 'Kapalı', tappable: false, comingSoon: true },
      ],
    },
    {
      title: 'Hakkında',
      items: [
        { emoji: 'ℹ️', label: 'Uygulama Versiyonu', value: '1.0.0', tappable: false },
        {
          emoji: '📄', label: 'Gizlilik Politikası', value: '›', tappable: true,
          onPress: () => Alert.alert('Gizlilik', 'Gizlilik politikası yakında eklenecek.'),
        },
        {
          emoji: '📋', label: 'Kullanım Koşulları', value: '›', tappable: true,
          onPress: () => Alert.alert('Koşullar', 'Kullanım koşulları yakında eklenecek.'),
        },
      ],
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    // AuthContext's onAuthStateChange will fire → useAuthGate redirects to /(auth)
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>

      {/* Toggles */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 100, duration: 500 }}
        style={styles.card}
      >
        <Text style={styles.sectionTitle}>Tercihler</Text>

        {/* Notifications — functional */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleEmoji}>🔔</Text>
            <View>
              <Text style={styles.toggleLabel}>Bildirimler</Text>
              <Text style={styles.toggleDesc}>Hatırlatmalar ve uyarılar</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#D1D1D6', true: C.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.divider} />

        {/* Dark Mode — coming soon */}
        <View style={[styles.toggleRow, styles.disabledRow]}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleEmoji}>🌙</Text>
            <View>
              <Text style={[styles.toggleLabel, styles.disabledLabel]}>Karanlık Mod</Text>
              <Text style={styles.toggleDesc}>Koyu renk tema</Text>
            </View>
          </View>
          <YakindaBadge />
        </View>
      </MotiView>

      {/* Sections */}
      {SECTIONS.map((section, si) => (
        <MotiView
          key={section.title}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 200 + si * 100, duration: 500 }}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item: any, i) => (
            <View key={item.label}>
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  item.tappable && pressed && styles.pressed,
                  item.comingSoon && styles.disabledRow,
                ]}
                onPress={item.tappable ? item.onPress : undefined}
                disabled={!item.tappable || item.comingSoon}
              >
                <Text style={styles.rowEmoji}>{item.emoji}</Text>
                <Text style={[styles.rowLabel, item.comingSoon && styles.disabledLabel]}>
                  {item.label}
                </Text>
                {item.comingSoon ? (
                  <YakindaBadge />
                ) : (
                  <Text style={styles.rowValue}>{item.value}</Text>
                )}
              </Pressable>
              {i < section.items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </MotiView>
      ))}

      {/* Sign Out */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 500, duration: 500 }}
      >
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </Pressable>
      </MotiView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: { padding: 20, paddingBottom: 48 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleEmoji: { fontSize: 22, marginRight: 12 },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: C.foreground },
  toggleDesc: { fontSize: 13, color: C.muted, marginTop: 1 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  pressed: { opacity: 0.7 },
  disabledRow: { opacity: 0.5 },
  disabledLabel: { color: C.muted },
  rowEmoji: { fontSize: 20, marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: C.foreground },
  rowValue: { fontSize: 14, color: C.muted },
  yakindaBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  yakindaText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  signOutBtn: {
    backgroundColor: C.dangerBg,
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  signOutText: { fontSize: 16, fontWeight: '700', color: C.danger },
});
