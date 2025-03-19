import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, MapPin, Plus } from 'lucide-react-native';
import { format } from 'date-fns';
import React, { useEffect, useState, useRef } from 'react';
import { Trip } from '@/libs/models/Trip';
import { Entry } from '@/libs/models/Entry';
import { useDatabase } from '@/libs/context/DatabaseContext';

const HEADER_MAX_HEIGHT = 300;
const HEADER_MIN_HEIGHT = 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Hilfsfunktion zum sicheren Parsen der Bilder-URLs
const parseImageUrls = (imagesJson: string | undefined): string[] => {
  if (!imagesJson) return [];

  try {
    const parsed = JSON.parse(imagesJson);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('Error parsing image URLs:', error);
  }

  return [];
};

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const { isInitialized } = useDatabase();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  // Animated value für den Scroll-Offset
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isInitialized && id) {
      loadTripData();
    }
  }, [isInitialized, id]);

  const loadTripData = async () => {
    try {
      setLoading(true);

      // Lade Trip-Daten
      const tripData = await Trip.findById(id as string);
      if (!tripData) {
        console.error('Trip nicht gefunden:', id);
        return;
      }

      setTrip(tripData);

      // Lade Einträge für diesen Trip
      const entriesData = await Entry.findByTripId(id as string);
      setEntries(entriesData);
    } catch (error) {
      console.error('Fehler beim Laden der Trip-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dummy Bild-URL für Trips ohne eigenes Bild
  const getDefaultImage = () => {
    return 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=800';
  };

  // Berechnete Werte für Parallax-Effekt
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE / 2],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8, 0.5],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  // Lade-Indikator während die Daten geladen werden
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </SafeAreaView>
    );
  }

  // Falls Trip nicht gefunden wurde
  if (!trip) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <Text style={styles.errorText}>Trip not found</Text>
        <TouchableOpacity
          style={styles.backButtonFallback}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Parallax Header - Fix height animation issue */}
      <Animated.View
        style={[styles.headerContainer, { height: HEADER_MAX_HEIGHT }]}
      >
        <Animated.Image
          source={{ uri: getDefaultImage() }}
          style={[
            styles.mainImage,
            {
              transform: [{ translateY: imageTranslateY }],
              opacity: imageOpacity,
            },
          ]}
        />
        <View style={styles.imageOverlay} />

        {/* Content-Container für kleinere Header */}
        <Animated.View
          style={[
            styles.headerContentContainer,
            {
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, HEADER_SCROLL_DISTANCE],
                    outputRange: [0, -HEADER_SCROLL_DISTANCE],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          {/* Header Buttons */}
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push(`/(tabs)/(journal)/trip/${id}/new-entry`)
              }
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Animierter Titel für Minimized Header */}
        <Animated.View
          style={[
            styles.headerTitleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {trip.title}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Fester Header für minimierte Ansicht */}
      <Animated.View
        style={[
          styles.minHeaderContainer,
          {
            opacity: scrollY.interpolate({
              inputRange: [
                0,
                HEADER_SCROLL_DISTANCE * 0.5,
                HEADER_SCROLL_DISTANCE,
              ],
              outputRange: [0, 0.5, 1],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <View style={styles.minHeaderContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {trip.title}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              router.push(`/(tabs)/(journal)/trip/${id}/new-entry`)
            }
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{trip.title}</Text>

          <View style={styles.locationContainer}>
            <MapPin size={20} color="#2563EB" />
            <Text style={styles.location}>
              {trip.description || 'No destinations set'}
            </Text>
          </View>

          {trip.start_date && trip.end_date && (
            <Text style={styles.date}>
              {format(new Date(trip.start_date), 'MMM d')} -{' '}
              {format(new Date(trip.end_date), 'MMM d, yyyy')}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Journal Entries</Text>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No journal entries yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start documenting your adventure by adding an entry
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() =>
                  router.push(`/(tabs)/(journal)/trip/${id}/entry/${entry.id}`)
                }
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>
                    {format(new Date(entry.created_at), 'EEEE, MMMM d')}
                  </Text>
                </View>

                {entry.location && (
                  <View style={styles.locationTag}>
                    <MapPin size={12} color="#2563EB" />
                    <Text style={styles.locationText}>{entry.location}</Text>
                  </View>
                )}

                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryExcerpt}>
                  {entry.content
                    ? entry.content.length > 150
                      ? `${entry.content.substring(0, 150)}...`
                      : entry.content
                    : 'No content'}
                </Text>

                {/* Anzeige der Bilder, falls vorhanden */}
                {entry.images &&
                  (() => {
                    const imageUrls = parseImageUrls(entry.images);
                    if (imageUrls.length === 0) return null;

                    return (
                      <View style={styles.entryImagesContainer}>
                        {imageUrls.slice(0, 3).map((imageUri, index) => (
                          <Image
                            key={index}
                            source={{ uri: imageUri }}
                            style={styles.entryThumbnail}
                          />
                        ))}
                        {imageUrls.length > 3 && (
                          <View style={styles.moreImagesIndicator}>
                            <Text style={styles.moreImagesText}>
                              +{imageUrls.length - 3}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}
              </TouchableOpacity>
            ))
          )}
        </View>
      </Animated.ScrollView>
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
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    zIndex: 1,
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: HEADER_MAX_HEIGHT,
    position: 'absolute',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 1,
    marginTop: 50,
  },
  headerTitleContainer: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
  },
  headerTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 78, 230, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  content: {
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
    marginBottom: 8,
  },
  location: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#2563EB',
    marginLeft: 8,
  },
  date: {
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
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
    marginBottom: 2,
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
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginTop: 4,
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
  entryImagesContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  entryThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 8,
  },
  moreImagesIndicator: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#2563EB',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontFamily: 'Nunito-Medium',
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButtonFallback: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  headerContentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MAX_HEIGHT,
    overflow: 'hidden',
    zIndex: 1,
  },
  minHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    backgroundColor: '#1E293B',
    zIndex: 2,
  },
  minHeaderContent: {
    height: HEADER_MIN_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
});
