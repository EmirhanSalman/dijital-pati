import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

const MOCK_PETS = [
  { id: '1', name: 'Karamel', species: 'Kedi', location: 'Kadıköy, İstanbul', date: '2 saat önce', emoji: '🐱' },
  { id: '2', name: 'Duman', species: 'Köpek', location: 'Beşiktaş, İstanbul', date: '5 saat önce', emoji: '🐶' },
  { id: '3', name: 'Pamuk', species: 'Tavşan', location: 'Üsküdar, İstanbul', date: '1 gün önce', emoji: '🐰' },
  { id: '4', name: 'Zeytin', species: 'Kedi', location: 'Şişli, İstanbul', date: '2 gün önce', emoji: '🐱' },
];

export default function LostPetsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.banner}
      >
        <Text style={styles.bannerTitle}>🔍 {MOCK_PETS.length} Aktif İlan</Text>
        <Text style={styles.bannerSub}>Bölgenizdeki kayıp hayvanlar</Text>
      </MotiView>

      {MOCK_PETS.map((pet, i) => (
        <MotiView
          key={pet.id}
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', delay: i * 100, duration: 500 }}
        >
          <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.cardLeft}>
              <View style={styles.emojiCircle}>
                <Text style={styles.emoji}>{pet.emoji}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petSpecies}>{pet.species}</Text>
              <Text style={styles.petLocation}>📍 {pet.location}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.date}>{pet.date}</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>Acil</Text>
              </View>
            </View>
          </Pressable>
        </MotiView>
      ))}

      <Pressable style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ Yeni İlan Ver</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 16, paddingBottom: 40 },
  banner: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  bannerSub: { fontSize: 14, color: '#FFE0CC' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  cardLeft: { marginRight: 12 },
  emojiCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFF3EB', alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  petName: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  petSpecies: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  petLocation: { fontSize: 13, color: '#636366' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  date: { fontSize: 12, color: '#AEAEB2' },
  urgentBadge: { backgroundColor: '#FF3B3015', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgentText: { fontSize: 12, fontWeight: '600', color: '#FF3B30' },
  addBtn: {
    backgroundColor: '#FF6B00', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
