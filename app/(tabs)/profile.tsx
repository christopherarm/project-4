import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, MapPin, Flag } from 'lucide-react-native';

export default function ProfileScreen() {
  const stats = [
    { id: 1, label: 'Countries', value: '12', icon: Flag },
    { id: 2, label: 'Cities', value: '24', icon: MapPin },
  ];

  return (
    <View style={styles.wrapper}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
              }}
              style={styles.profileImage}
            />
            <Text style={styles.name}>Sarah Parker</Text>
            <Text style={styles.bio}>Adventure seeker | Photography lover</Text>
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <stat.icon size={24} color="#2563EB" style={styles.statIcon} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            <View style={styles.badgesGrid}>
              {[1, 2, 3].map((badge) => (
                <View key={badge} style={styles.badgeItem}>
                  <View style={styles.badge} />
                  <Text style={styles.badgeLabel}>Badge {badge}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 36,
    color: '#1E293B',
    letterSpacing: -1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    color: '#1E293B',
    marginBottom: 4,
  },
  bio: {
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    color: '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    marginBottom: 8,
  },
  badgeLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#64748B',
  },
});
