import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { format } from 'date-fns';

export default function TripsScreen() {
  const trips = [
    {
      id: 1,
      title: 'Italian Adventure',
      startDate: new Date(2024, 1, 15),
      endDate: new Date(2024, 1, 25),
      coverImage: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=800',
      destinations: ['Venice', 'Florence', 'Rome'],
      entriesCount: 5,
    },
    {
      id: 2,
      title: 'Swiss Alps Expedition',
      startDate: new Date(2024, 2, 10),
      endDate: new Date(2024, 2, 20),
      coverImage: 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&q=80&w=800',
      destinations: ['Zermatt', 'Lucerne', 'Interlaken'],
      entriesCount: 3,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Trips</Text>
          <TouchableOpacity 
            style={styles.newTripButton}
            onPress={() => router.push('/(tabs)/(journal)/new-trip')}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.newTripButtonText}>New Trip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {trips.map((trip) => (
            <TouchableOpacity 
              key={trip.id} 
              style={styles.tripCard}
              onPress={() => router.push(`/(tabs)/(journal)/trip/${trip.id}`)}>
              <Image source={{ uri: trip.coverImage }} style={styles.cardImage} />
              <View style={styles.cardOverlay} />
              <View style={styles.cardContent}>
                <Text style={styles.tripTitle}>{trip.title}</Text>
                <View style={styles.tripDetails}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>
                      {format(trip.startDate, 'MMM d')} - {format(trip.endDate, 'MMM d, yyyy')}
                    </Text>
                  </View>
                  <View style={styles.destinationsContainer}>
                    <Text style={styles.destinationsText}>
                      {trip.destinations.join(' • ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.entriesContainer}>
                  <Text style={styles.entriesCount}>{trip.entriesCount}</Text>
                  <Text style={styles.entriesLabel}>entries</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 36,
    color: '#1E293B',
    letterSpacing: -1,
  },
  newTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newTripButtonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    height: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  tripTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tripDetails: {
    gap: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  destinationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationsText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  entriesContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  entriesCount: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: '#1E293B',
  },
  entriesLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: 12,
    color: '#64748B',
  },
});