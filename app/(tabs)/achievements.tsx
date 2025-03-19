import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Map, Camera, Book } from 'lucide-react-native';

export default function AchievementsScreen() {
  const achievements = [
    {
      id: 1,
      title: 'First Journey',
      description: 'Created your first travel journal entry',
      icon: Book,
      progress: 100,
      color: '#2563EB',
    },
    {
      id: 2,
      title: 'Photographer',
      description: 'Added 10 photos to your journal',
      icon: Camera,
      progress: 60,
      color: '#16A34A',
    },
    {
      id: 3,
      title: 'Globe Trotter',
      description: 'Visited 5 different countries',
      icon: Map,
      progress: 40,
      color: '#EA580C',
    },
    {
      id: 4,
      title: 'Story Teller',
      description: 'Write 20 journal entries',
      icon: Award,
      progress: 25,
      color: '#9333EA',
    },
  ];

  return (
    <View style={styles.wrapper}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${achievement.color}20` },
                ]}
              >
                <achievement.icon size={24} color={achievement.color} />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${achievement.progress}%`,
                        backgroundColor: achievement.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{achievement.progress}%</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingTop: 40,
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
  content: {
    flex: 1,
    padding: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  achievementDescription: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: '#64748B',
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topSafeArea: {
    backgroundColor: '#FFFFFF',
  },
});
