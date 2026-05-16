import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../_layout';

const BRAND = {
  primary:     '#6366F1',
  primaryDark: '#4F46E5',
  primaryBg:   '#EEF2FF',
  navy:        '#1A2744',
  background:  '#F8FAFC',
  surface:     '#FFFFFF',
  foreground:  '#090E1A',
  muted:       '#64748B',
  border:      '#E2E8F0',
  success:     '#22C55E',
  danger:      '#EF4444',
  info:        '#3B82F6',
};

const QUICK_ACTIONS = [
  { emoji: '🔍', label: 'Kayıp İlanları', description: 'Kayıp & bulunan hayvanlar', route: '/(app)/lost-pets', color: BRAND.primary },
  { emoji: '📷', label: 'QR Okut',        description: 'Künye tara, konum kaydet',   route: '/(app)/scanner', color: BRAND.success },
  { emoji: '🗺️', label: 'Harita',         description: 'Kayıp ilanlar ve arama alanı', route: '/(app)/map',     color: BRAND.danger  },
  { emoji: '💬', label: 'Pati Forum',     description: 'Toplulukla bilgi paylaş',   route: '/(app)/forum',     color: BRAND.info    },
  { emoji: '📰', label: 'Haberler',       description: 'Güncel ipuçları & haberler', route: '/(app)/news',     color: BRAND.success  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [myPetCount, setMyPetCount] = useState<number | null>(null);
  const [lostCount, setLostCount] = useState<number | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);

    const userId = session?.user?.id;
    if (!userId) {
      setMyPetCount(0);
      setLostCount(0);
      setStatsLoading(false);
      return;
    }

    const [mine, lost] = await Promise.all([
      supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId),
      supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('is_lost', true),
    ]);

    if (mine.error || lost.error) {
      setStatsError('İstatistikler yüklenemedi.');
      setMyPetCount(null);
      setLostCount(null);
    } else {
      setMyPetCount(mine.count ?? 0);
      setLostCount(lost.count ?? 0);
    }
    setStatsLoading(false);
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const cards = [
    {
      emoji: '🐾',
      label: 'Toplam Hayvanım',
      value: statsLoading ? '…' : statsError ? '—' : String(myPetCount ?? 0),
      color: BRAND.primary,
    },
    {
      emoji: '🔍',
      label: 'Kayıp İlanları',
      value: statsLoading ? '…' : statsError ? '—' : String(lostCount ?? 0),
      color: BRAND.danger,
    },
    {
      emoji: '✅',
      label: 'Aktif Görevler',
      value: '0',
      color: BRAND.success,
      comingSoon: true,
    },
    {
      emoji: '💉',
      label: 'Yaklaşan Aşı',
      value: '-',
      color: BRAND.info,
      comingSoon: true,
    },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Merhaba 👋</Text>
      <Text style={styles.subtitle}>Bugün nelere bakacaksın?</Text>

      {statsError ? (
        <Text style={styles.statsError}>{statsError}</Text>
      ) : null}

      <View style={styles.cardGrid}>
        {cards.map((card, i) => (
          <MotiView
            key={card.label}
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: i * 100, duration: 500 }}
            style={[
              styles.summaryCard,
              { borderTopColor: card.color },
              card.comingSoon && styles.disabledCard,
            ]}
          >
            {statsLoading && !card.comingSoon ? (
              <ActivityIndicator size="small" color={card.color} style={styles.cardLoader} />
            ) : (
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
            )}
            <Text style={[styles.cardValue, { color: card.comingSoon ? BRAND.muted : card.color }]}>
              {card.value}
            </Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
            {card.comingSoon ? (
              <View style={styles.yakindaBadge}>
                <Text style={styles.yakindaText}>Yakında</Text>
              </View>
            ) : null}
          </MotiView>
        ))}
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 450, duration: 500 }}
      >
        <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.route}
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: `${action.color}18` }]}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDesc}>{action.description}</Text>
            </View>
            <Text style={[styles.chevron, { color: action.color }]}>›</Text>
          </Pressable>
        ))}
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', delay: 600, duration: 500 }}
        style={styles.recentCard}
      >
        <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>Henüz aktivite yok</Text>
          <Text style={styles.emptySubtext}>
            Evcil hayvan ekledikçe aktiviteler burada görünecek.
          </Text>
        </View>
      </MotiView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BRAND.background },
  container: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 28, fontWeight: '800', color: BRAND.foreground, marginBottom: 4 },
  subtitle: { fontSize: 16, color: BRAND.muted, marginBottom: 12 },
  statsError: { fontSize: 13, color: BRAND.danger, marginBottom: 8 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  summaryCard: {
    width: '47%',
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    borderTopWidth: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    minHeight: 110,
  },
  disabledCard: { opacity: 0.55 },
  cardLoader: { marginBottom: 6, alignSelf: 'flex-start' },
  cardEmoji: { fontSize: 24, marginBottom: 6 },
  cardValue: { fontSize: 30, fontWeight: '800', marginBottom: 2 },
  cardLabel: { fontSize: 12, color: BRAND.muted },
  yakindaBadge: {
    position: 'absolute',
    top: 8, right: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  yakindaText: { fontSize: 9, fontWeight: '700', color: '#D97706' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: BRAND.foreground, marginBottom: 12 },
  actionCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  actionIconCircle: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  actionEmoji: { fontSize: 24 },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 16, fontWeight: '700', color: BRAND.foreground, marginBottom: 2 },
  actionDesc: { fontSize: 13, color: BRAND.muted },
  chevron: { fontSize: 26, fontWeight: '300' },
  recentCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: BRAND.border,
    shadowColor: BRAND.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '700', color: BRAND.navy, marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: BRAND.muted, textAlign: 'center', lineHeight: 20 },
});
