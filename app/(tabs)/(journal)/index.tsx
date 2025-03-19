import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Button,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, RefreshCw, WifiOff } from 'lucide-react-native';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Trip } from '@/libs/models/Trip';
import { Entry } from '@/libs/models/Entry';
import { useDatabase } from '@/libs/context/DatabaseContext';

export default function TripsScreen() {
  const { isInitialized, syncData, isSync, error } = useDatabase();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripEntries, setTripEntries] = useState<Record<string, number>>({});
  const [tripLocations, setTripLocations] = useState<Record<string, string[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Funktion zum Testen der Datenbank (temporär)
  const createTestTrip = async () => {
    if (!isInitialized) return;

    try {
      const testTrip = new Trip({
        title: 'Testtrip ' + new Date().toISOString().slice(11, 19),
        description: 'Ein Test für die SQLite Datenbank',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });

      await testTrip.save();
      console.log('Testtrip erstellt:', testTrip);
      await loadTrips(); // Lade Trips neu
    } catch (err) {
      console.error('Fehler beim Erstellen des Testtrips:', err);
    }
  };

  // Lade Trips aus der Datenbank
  const loadTrips = async () => {
    try {
      // Warte bis die Datenbank initialisiert ist
      if (!isInitialized) return;

      setLoading(true);

      // Lade alle aktiven Trips
      const tripsData = await Trip.findAll();
      setTrips(tripsData);

      // Lade Entries für jeden Trip und baue Locations-Array
      const entryCounts: Record<string, number> = {};
      const locationsList: Record<string, string[]> = {};

      for (const trip of tripsData) {
        const entries = await Entry.findByTripId(trip.id);
        entryCounts[trip.id] = entries.length;

        // Sammle einzigartige Locations
        const uniqueLocations = Array.from(
          new Set(
            entries
              .filter((entry) => entry.location)
              .map((entry) => entry.location as string)
          )
        );

        locationsList[trip.id] = uniqueLocations;
      }

      setTripEntries(entryCounts);
      setTripLocations(locationsList);
    } catch (err) {
      console.error('Fehler beim Laden der Trips:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Beim ersten Laden und wenn die Datenbank initialisiert wird
  useEffect(() => {
    if (isInitialized) {
      loadTrips();
    }
  }, [isInitialized]);

  // Pull-to-Refresh Handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
  };

  // Manuell Synchronisieren mit Supabase
  const handleSync = async () => {
    if (isSync) return;

    try {
      const result = await syncData();
      if (result.success) {
        // Wenn Synchronisierung erfolgreich, lade Daten neu
        await loadTrips();
      }
    } catch (err) {
      console.error('Synchronisierungsfehler:', err);
    }
  };

  // Funktion zum Löschen aller Trips
  const deleteAllTrips = async () => {
    if (!isInitialized) return;

    Alert.alert(
      'Alle Trips löschen',
      'Möchten Sie wirklich alle Trips löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Lösche jeden Trip einzeln
              for (const trip of trips) {
                await trip.delete();
              }
              console.log('Alle Trips wurden gelöscht');
              await loadTrips(); // Lade Trips neu (sollte leer sein)
            } catch (err) {
              console.error('Fehler beim Löschen der Trips:', err);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Dummy Bild-URL für Trips ohne eigenes Bild
  const getDefaultImage = (index: number) => {
    const images = [
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&q=80&w=800',
    ];
    return images[index % images.length];
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea} />
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>My Trips</Text>
            {error && (
              <View style={styles.errorIndicator}>
                <WifiOff size={14} color="#EF4444" />
              </View>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.syncButton, isSync && styles.syncButtonDisabled]}
              onPress={handleSync}
              disabled={isSync}
            >
              <RefreshCw
                size={16}
                color="#1E293B"
                style={isSync ? styles.syncingIcon : undefined}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newTripButton}
              onPress={() => router.push('/(tabs)/(journal)/new-trip')}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.newTripButtonText}>New Trip</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isInitialized || loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading trips...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2563EB']}
              />
            }
          >
            {trips.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No trips yet</Text>
                <Text style={styles.emptyStateText}>
                  Create your first trip by tapping the New Trip button above.
                </Text>

                {/* Temporärer Test-Button */}
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={createTestTrip}
                >
                  <Text style={styles.testButtonText}>Create Test Trip</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Testbuttons */}
                <View style={styles.testButtonsContainer}>
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={createTestTrip}
                  >
                    <Text style={styles.testButtonText}>Create Test Trip</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={deleteAllTrips}
                  >
                    <Text style={styles.testButtonText}>Delete All Trips</Text>
                  </TouchableOpacity>
                </View>

                {trips.map((trip, index) => (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.tripCard}
                    onPress={() =>
                      router.push(`/(tabs)/(journal)/trip/${trip.id}`)
                    }
                  >
                    <Image
                      source={{ uri: getDefaultImage(index) }}
                      style={styles.cardImage}
                    />
                    <View style={styles.cardOverlay} />
                    <View style={styles.cardContent}>
                      <Text style={styles.tripTitle}>{trip.title}</Text>
                      <View style={styles.tripDetails}>
                        {trip.start_date && trip.end_date && (
                          <View style={styles.dateContainer}>
                            <Text style={styles.dateText}>
                              {format(new Date(trip.start_date), 'MMM d')} -{' '}
                              {format(new Date(trip.end_date), 'MMM d, yyyy')}
                            </Text>
                          </View>
                        )}
                        {tripLocations[trip.id]?.length > 0 && (
                          <View style={styles.destinationsContainer}>
                            <Text style={styles.destinationsText}>
                              {tripLocations[trip.id].slice(0, 3).join(' • ')}
                              {tripLocations[trip.id].length > 3 && ' • ...'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.entriesContainer}>
                        <Text style={styles.entriesCount}>
                          {tripEntries[trip.id] || 0}
                        </Text>
                        <Text style={styles.entriesLabel}>entries</Text>
                      </View>
                      {trip.sync_status !== 'synced' && (
                        <View style={styles.syncStatusBadge}>
                          <Text style={styles.syncStatusText}>
                            {trip.sync_status === 'pending'
                              ? 'Pending'
                              : 'Failed'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        )}
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 36,
    color: '#1E293B',
    letterSpacing: -1,
  },
  errorIndicator: {
    marginLeft: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 6,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncButton: {
    backgroundColor: '#E2E8F0',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncingIcon: {
    transform: [{ rotate: '45deg' }],
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Nunito-Medium',
    fontSize: 16,
    color: '#64748B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
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
  syncStatusBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    backgroundColor: 'rgba(250, 204, 21, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  syncStatusText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: '#854D0E',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 20,
  },
  testButton: {
    backgroundColor: '#8257e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'center',
  },
  testButtonText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
