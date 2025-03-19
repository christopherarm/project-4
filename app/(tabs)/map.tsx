import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import {
  MapPin,
  List,
  X,
  Navigation,
  Globe as Globe2,
  Building2,
  Plane,
  Clock,
  Map,
  Calendar,
  Activity,
} from 'lucide-react-native';
import MapView, {
  Marker,
  Callout,
  Polyline,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  UserLocationChangeEvent,
} from 'react-native-maps';
import { router } from 'expo-router';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import AnimatedNumbers from 'react-native-animated-numbers';

interface Location {
  id: number;
  title: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

interface TravelLocation {
  id: number;
  title: string;
  description: string;
  locations: Location[];
  date: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 60;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const selectedTripId = useSharedValue<number | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TravelLocation | null>(null);
  const [showList, setShowList] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    heading: number | null;
  } | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [travelStats, setTravelStats] = useState({
    distance: 0,
    duration: 0,
    visitedPlaces: 0,
    daysLeft: 0,
  });

  const snapPoints = useMemo(() => ['30%', '50%'], []);

  const travelLocations = useMemo<TravelLocation[]>(
    () => [
      {
        id: 1,
        title: 'Italian Adventure',
        isActive: true,
        description: "A journey through Italy's most beautiful cities",
        locations: [
          {
            id: 1,
            title: 'Venice',
            coordinate: {
              latitude: 45.4408,
              longitude: 12.3155,
            },
          },
          {
            id: 2,
            title: 'Florence',
            coordinate: {
              latitude: 43.7696,
              longitude: 11.2558,
            },
          },
          {
            id: 3,
            title: 'Rome',
            coordinate: {
              latitude: 41.9028,
              longitude: 12.4964,
            },
          },
        ],
        date: 'Feb 15 - Mar 25, 2025',
        startDate: '2025-02-15',
        endDate: '2025-03-25',
      },
      {
        id: 2,
        title: 'Swiss Alps Tour',
        description: 'Exploring the Swiss mountains',
        locations: [
          {
            id: 1,
            title: 'Zurich',
            coordinate: {
              latitude: 47.3769,
              longitude: 8.5417,
            },
          },
          {
            id: 2,
            title: 'Lucerne',
            coordinate: {
              latitude: 47.0502,
              longitude: 8.3093,
            },
          },
          {
            id: 3,
            title: 'Zermatt',
            coordinate: {
              latitude: 46.0207,
              longitude: 7.7491,
            },
          },
        ],
        date: 'Apr 5 - Apr 15, 2025',
        startDate: '2025-04-05',
        endDate: '2025-04-15',
      },
    ],
    []
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading || null,
      });
    })();
  }, []);

  // Helper function to calculate distance between coordinates
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
          Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km
      return distance;
    },
    []
  );

  const deg2rad = useCallback((deg: number): number => {
    return deg * (Math.PI / 180);
  }, []);

  useEffect(() => {
    // Calculate statistics for active trip
    const activeTrip = travelLocations.find((trip) => trip.isActive);
    if (activeTrip) {
      // Calculate total distance of the trip
      let totalDistance = 0;
      for (let i = 0; i < activeTrip.locations.length - 1; i++) {
        const loc1 = activeTrip.locations[i].coordinate;
        const loc2 = activeTrip.locations[i + 1].coordinate;
        totalDistance += calculateDistance(
          loc1.latitude,
          loc1.longitude,
          loc2.latitude,
          loc2.longitude
        );
      }

      // Parse dates using the new properties
      const startDate = new Date(activeTrip.startDate);
      const endDate = new Date(activeTrip.endDate);

      // Use current date for dynamic calculations
      const today = new Date();

      // Calculate days left until end of trip
      const daysLeft = Math.max(
        0,
        Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Calculate trip duration in days
      const tripDurationDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate elapsed days
      const elapsedDays = Math.min(
        tripDurationDays,
        Math.max(
          0,
          Math.ceil(
            (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      );

      // Calculate visited places based on elapsed time proportion
      const totalLocations = activeTrip.locations.length;
      const visitedPlacesCount = Math.min(
        totalLocations,
        Math.max(
          1,
          Math.ceil((elapsedDays / tripDurationDays) * totalLocations)
        )
      );

      // Use setTimeout to create a visual effect of the numbers changing after component mounts
      setTimeout(() => {
        setTravelStats({
          distance: Math.round(totalDistance),
          duration: elapsedDays,
          visitedPlaces: visitedPlacesCount,
          daysLeft,
        });
      }, 500);
    }
  }, [travelLocations, calculateDistance]);

  const handleUserLocationChange = useCallback(
    (event: UserLocationChangeEvent) => {
      if (isTrackingLocation && event.nativeEvent.coordinate) {
        const { latitude, longitude, heading } = event.nativeEvent.coordinate;
        setUserLocation({
          latitude,
          longitude,
          heading: heading || null,
        });
      }
    },
    [isTrackingLocation]
  );

  const focusUserLocation = useCallback(() => {
    if (!userLocation) return;

    setIsTrackingLocation(true);
    mapRef.current?.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  }, [userLocation]);

  const calculateRegion = useCallback((locations: Location[]) => {
    const latitudes = locations.map((loc) => loc.coordinate.latitude);
    const longitudes = locations.map((loc) => loc.coordinate.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const PADDING_FACTOR = 0.5;
    const latDelta = (maxLat - minLat) * (1 + PADDING_FACTOR);
    const lngDelta = (maxLng - minLng) * (1 + PADDING_FACTOR);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }, []);

  const calculateAllTripsRegion = useCallback(() => {
    const allLocations = travelLocations.flatMap((trip) => trip.locations);
    return calculateRegion(allLocations);
  }, [travelLocations, calculateRegion]);

  const handleMarkerPress = useCallback(
    (trip: TravelLocation) => {
      setSelectedTrip(trip);
      selectedTripId.value = withSpring(trip.id);
      const region = calculateRegion(trip.locations);
      requestAnimationFrame(() => {
        mapRef.current?.animateToRegion(region, 1000);
      });
    },
    [calculateRegion, selectedTripId]
  );

  const handleShowAllTrips = useCallback(() => {
    setSelectedTrip(null);
    selectedTripId.value = null as any;
    const region = calculateAllTripsRegion();
    requestAnimationFrame(() => {
      mapRef.current?.animateToRegion(region, 1000);
    });
  }, [calculateAllTripsRegion, selectedTripId]);

  const handleSheetChanges = useCallback((index: number) => {
    setShowList(index !== -1);
  }, []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleDismissModalPress = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const initialRegion = useMemo(
    () => calculateAllTripsRegion(),
    [calculateAllTripsRegion]
  );

  const renderMarkers = useCallback(() => {
    if (selectedTrip) {
      return (
        <>
          <Polyline
            coordinates={selectedTrip.locations.map((loc) => loc.coordinate)}
            strokeColor="#2563EB"
            strokeWidth={3}
            lineDashPattern={[1]}
          />
          {selectedTrip.locations.map((location, index) => (
            <Marker
              key={`${selectedTrip.id}-${location.id}`}
              coordinate={location.coordinate}
              tracksViewChanges={false}
            >
              <View style={[styles.customMarker, styles.selectedMarker]}>
                <Text style={styles.markerNumber}>{index + 1}</Text>
              </View>
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{location.title}</Text>
                  <Text style={styles.calloutDescription}>
                    Stop {index + 1} of {selectedTrip.locations.length}
                  </Text>
                  <Text style={styles.calloutDate}>{selectedTrip.date}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </>
      );
    }

    return travelLocations.map((trip) => (
      <Marker
        key={trip.id}
        coordinate={trip.locations[0].coordinate}
        onPress={() => handleMarkerPress(trip)}
        tracksViewChanges={false}
      >
        <View style={styles.customMarker}>
          <MapPin size={20} color="#2563EB" />
        </View>
        <Callout tooltip onPress={() => handleMarkerPress(trip)}>
          <View style={styles.calloutContainer}>
            <Text style={styles.calloutTitle}>{trip.title}</Text>
            <Text style={styles.calloutDescription}>{trip.description}</Text>
            <Text style={styles.calloutDate}>{trip.date}</Text>
            <Text style={styles.calloutAction}>Tap to view route →</Text>
          </View>
        </Callout>
      </Marker>
    ));
  }, [selectedTrip, travelLocations, handleMarkerPress]);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Travels</Text>
          <TouchableOpacity
            style={styles.listButton}
            onPress={() => {
              if (showList) {
                handleDismissModalPress();
              } else {
                handlePresentModalPress();
              }
            }}
          >
            {showList ? (
              <X size={24} color="#64748B" />
            ) : (
              <List size={24} color="#64748B" />
            )}
          </TouchableOpacity>
        </View>

        {/* Live Activity for Current Trip */}
        {travelLocations.some((trip) => trip.isActive) && (
          <View style={styles.liveActivityContainer}>
            <View style={styles.liveActivityHeader}>
              <View style={[styles.liveActivityPulse]}>
                <Activity size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.liveActivityTitle}>
                {travelLocations.find((trip) => trip.isActive)?.title ||
                  'Current Trip'}
                <Text style={[styles.liveActivityEmoji]}> ✈️</Text>
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statItem]}>
                <Map size={16} color="#2563EB" />
                <View style={styles.statValueContainer}>
                  <AnimatedNumbers
                    includeComma
                    animateToNumber={travelStats.distance}
                    fontStyle={styles.statValue}
                  />
                  <Text style={styles.statUnit}>km</Text>
                </View>
                <Text style={styles.statLabel}>Distance</Text>
              </View>

              <View style={[styles.statItem]}>
                <Clock size={16} color="#2563EB" />
                <View style={styles.statValueContainer}>
                  <AnimatedNumbers
                    includeComma
                    animateToNumber={travelStats.duration}
                    fontStyle={styles.statValue}
                  />
                  <Text style={styles.statUnit}>d</Text>
                </View>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={[styles.statItem]}>
                <Building2 size={16} color="#2563EB" />
                <View style={styles.statValueContainer}>
                  <AnimatedNumbers
                    includeComma
                    animateToNumber={travelStats.visitedPlaces}
                    fontStyle={styles.statValue}
                  />
                </View>
                <Text style={styles.statLabel}>Places</Text>
              </View>

              <View style={[styles.statItem]}>
                <Calendar size={16} color="#2563EB" />
                <View style={styles.statValueContainer}>
                  <AnimatedNumbers
                    includeComma
                    animateToNumber={travelStats.daysLeft}
                    fontStyle={styles.statValue}
                  />
                </View>
                <Text style={styles.statLabel}>Days Left</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={
              Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE
            }
            initialRegion={initialRegion}
            mapType="standard"
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass
            showsScale
            onUserLocationChange={handleUserLocationChange}
            onMapReady={() => setMapReady(true)}
            key={selectedTrip ? `map-${selectedTrip.id}` : 'map-all'}
          >
            {mapReady && renderMarkers()}
            {mapReady && userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                flat
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View
                  style={[
                    styles.userLocationMarker,
                    userLocation.heading !== null && {
                      transform: [{ rotate: `${userLocation.heading}deg` }],
                    },
                  ]}
                >
                  <Navigation
                    size={24}
                    color="#2563EB"
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </View>
              </Marker>
            )}
          </MapView>

          <View style={styles.mapButtons}>
            {selectedTrip && (
              <TouchableOpacity
                style={styles.mapButton}
                onPress={handleShowAllTrips}
              >
                <Text style={styles.mapButtonText}>Show All Trips</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.mapButton,
                styles.locationButton,
                isTrackingLocation && styles.activeLocationButton,
              ]}
              onPress={focusUserLocation}
            >
              <Navigation
                size={20}
                color={isTrackingLocation ? '#FFFFFF' : '#2563EB'}
                style={{ transform: [{ rotate: '45deg' }] }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose
          handleIndicatorStyle={styles.bottomSheetIndicator}
          backgroundStyle={styles.bottomSheetBackground}
        >
          <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
            {travelLocations.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={[
                  styles.locationItem,
                  selectedTrip?.id === trip.id && styles.selectedLocationItem,
                ]}
                onPress={() => handleMarkerPress(trip)}
              >
                <MapPin
                  size={20}
                  color={selectedTrip?.id === trip.id ? '#FFFFFF' : '#2563EB'}
                />
                <View style={styles.locationInfo}>
                  <Text
                    style={[
                      styles.locationTitle,
                      selectedTrip?.id === trip.id &&
                        styles.selectedLocationText,
                    ]}
                  >
                    {trip.title}
                  </Text>
                  <Text
                    style={[
                      styles.locationDate,
                      selectedTrip?.id === trip.id &&
                        styles.selectedLocationText,
                    ]}
                  >
                    {trip.locations.map((loc) => loc.title).join(' → ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </View>
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
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 36,
    color: '#1E293B',
    letterSpacing: -1,
  },
  listButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedMarker: {
    backgroundColor: '#2563EB',
    borderColor: '#FFFFFF',
  },
  markerNumber: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  calloutContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  calloutDescription: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  calloutDate: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: '#2563EB',
    marginBottom: 4,
  },
  calloutAction: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: '#2563EB',
    textAlign: 'right',
  },
  mapButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  mapButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButtonText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#2563EB',
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeLocationButton: {
    backgroundColor: '#2563EB',
  },
  userLocationMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheetIndicator: {
    backgroundColor: '#CBD5E1',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    padding: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  selectedLocationItem: {
    backgroundColor: '#2563EB',
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationTitle: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  locationDate: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  selectedLocationText: {
    color: '#FFFFFF',
  },
  liveActivityContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  liveActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveActivityPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  liveActivityTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#1E293B',
  },
  liveActivityEmoji: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 2,
    height: 20, // Fixed height to prevent layout shifts
  },
  statUnit: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 2,
  },
  statLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: 12,
    color: '#64748B',
  },
});
