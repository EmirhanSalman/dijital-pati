import { ScrollView, View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useState } from 'react';

const SECTIONS = [
  {
    title: 'Hesap',
    items: [
      { emoji: '📧', label: 'E-posta Adresi', value: 'ahmet@digitalpati.app' },
      { emoji: '📱', label: 'Telefon', value: '+90 555 000 00 00' },
      { emoji: '🌍', label: 'Dil', value: 'Türkçe' },
    ],
  },
  {
    title: 'Uygulama',
    items: [
      { emoji: '🎨', label: 'Tema', value: 'Açık' },
      { emoji: '📍', label: 'Konum İzni', value: 'Açık' },
      { emoji: '📷', label: 'Kamera İzni', value: 'Kapalı' },
    ],
  },
  {
    title: 'Hakkında',
    items: [
      { emoji: 'ℹ️', label: 'Uygulama Versiyonu', value: '1.0.0' },
      { emoji: '📄', label: 'Gizlilik Politikası', value: '›' },
      { emoji: '📋', label: 'Kullanım Koşulları', value: '›' },
    ],
  },
];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
            trackColor={{ false: '#D1D1D6', true: '#FF6B00' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleEmoji}>🌙</Text>
            <View>
              <Text style={styles.toggleLabel}>Karanlık Mod</Text>
              <Text style={styles.toggleDesc}>Koyu renk tema</Text>
            </View>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#D1D1D6', true: '#FF6B00' }}
            thumbColor="#fff"
          />
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
          {section.items.map((item, i) => (
            <View key={item.label}>
              <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Text style={styles.rowEmoji}>{item.emoji}</Text>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </Pressable>
              {i < section.items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </MotiView>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleEmoji: { fontSize: 22, marginRight: 12 },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  toggleDesc: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginTop: 12, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  pressed: { opacity: 0.7 },
  rowEmoji: { fontSize: 20, marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  rowValue: { fontSize: 14, color: '#8E8E93' },
});
