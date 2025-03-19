import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, MapPin, Heart, Plus } from 'lucide-react-native';
import { format } from 'date-fns';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();

  // This would normally come from your data store
  const trip = {
    id: 1,
    title: 'Italian Adventure',
    startDate: new Date(2024, 1, 15),
    endDate: new Date(2024, 1, 25),
    coverImage: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=800',
    destinations: ['Venice', 'Florence', 'Rome'],
    entries: [
      {
        id: 1,
        date: new Date(2024, 1, 15),
        title: 'Arrival in Venice',
        excerpt: 'Finally arrived in the beautiful city of Venice. The water taxi ride from the airport was an experience in itself...',
        images: ['https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&q=80&w=800'],
        location: 'Venice, Italy',
      },
      {
        id: 2,
        date: new Date(2024, 1, 16),
        title: 'St. Mark\'s Square',
        excerpt: 'Spent the morning exploring St. Mark\'s Basilica and the surrounding square. The architecture is breathtaking...',
        images: ['https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?auto=format&fit=crop&q=80&w=800'],
        location: 'Venice, Italy',
      },
    ],
    isFavorite: false,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: trip.coverImage }} style={styles.mainImage} />
          <View style={styles.imageOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.favoriteButton}>
              <Heart
                size={24}
                color="#FFFFFF"
                fill={trip.isFavorite ? '#FFFFFF' : 'none'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{trip.title}</Text>
          
          <View style={styles.locationContainer}>
            <MapPin size={20} color="#2563EB" />
            <Text style={styles.location}>{trip.destinations.join(' • ')}</Text>
            <Text style={styles.date}>
              {format(trip.startDate, 'MMM d')} - {format(trip.endDate, 'MMM d, yyyy')}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Journal Entries</Text>
          
          {trip.entries.map((entry) => (
            <TouchableOpacity 
              key={entry.id}
              style={styles.entryCard}
              onPress={() => router.push(`/(tabs)/(journal)/trip/${id}/entry/${entry.id}`)}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>
                  {format(entry.date, 'EEEE, MMMM d')}
                </Text>
                <View style={styles.locationTag}>
                  <MapPin size={12} color="#2563EB" />
                  <Text style={styles.locationText}>{entry.location}</Text>
                </View>
              </View>
              
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryExcerpt}>{entry.excerpt}</Text>
              
              {entry.images.length > 0 && (
                <Image source={{ uri: entry.images[0] }} style={styles.entryImage} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push(`/(tabs)/(journal)/trip/${id}/new-entry`)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 36,
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: -1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  location: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#2563EB',
    marginLeft: 8,
    marginRight: 12,
  },
  date: {
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    color: '#64748B',
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    color: '#1E293B',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#64748B',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: '#2563EB',
    marginLeft: 4,
  },
  entryTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 8,
  },
  entryExcerpt: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
  },
  entryImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});