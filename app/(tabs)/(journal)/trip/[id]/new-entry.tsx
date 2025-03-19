import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  X,
  MapPin,
  Image as ImageIcon,
  Mic,
  Navigation,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Entry } from '@/libs/models/Entry';
import { useDatabase } from '@/libs/context/DatabaseContext';

export default function NewEntryScreen() {
  const { id } = useLocalSearchParams();
  const { isInitialized, syncData } = useDatabase();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Unable to access your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const { city, region, country } = address[0];
        const locationString = [city, region, country]
          .filter(Boolean)
          .join(', ');
        setLocation(locationString);
        setCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const saveEntry = async () => {
    if (!title.trim()) {
      Alert.alert(
        'Missing information',
        'Please provide a title for your entry.'
      );
      return;
    }

    if (!isInitialized) {
      Alert.alert('Database not ready', 'Please try again in a moment.');
      return;
    }

    try {
      setIsSaving(true);

      // Neuen Entry erstellen
      const newEntry = new Entry();
      newEntry.trip_id = id as string;
      newEntry.title = title.trim();
      newEntry.content = content.trim();
      newEntry.location = location.trim();

      if (coordinates) {
        newEntry.latitude = coordinates.latitude;
        newEntry.longitude = coordinates.longitude;
      }

      // Bilder-URLs als JSON-String in der images-Eigenschaft speichern
      if (images.length > 0) {
        newEntry.images = JSON.stringify(images);
      }

      // Entry in der Datenbank speichern
      await newEntry.save();
      console.log('Entry saved:', newEntry);

      // Optional: Daten synchronisieren
      try {
        console.log('Starting synchronization after creating a new entry');
        // Synchronisierung im Hintergrund starten, ohne auf Abschluss zu warten
        syncData().catch((e) => console.log('Sync error:', e));
      } catch (syncError) {
        console.error('Error during sync:', syncError);
      }

      // Zurück zur Trip-Detail-Ansicht navigieren
      router.back();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Could not save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <X size={24} color="#64748B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Entry</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!title.trim() || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={saveEntry}
          disabled={!title.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.titleInput}
          placeholder="Title your day"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.locationContainer}>
          <MapPin size={20} color="#2563EB" />
          <TextInput
            style={styles.locationInput}
            placeholder="Add location"
            placeholderTextColor="#94A3B8"
            value={location}
            onChangeText={setLocation}
          />
          <TouchableOpacity
            onPress={getCurrentLocation}
            style={[
              styles.getCurrentLocation,
              isGettingLocation && styles.gettingLocation,
            ]}
          >
            <Navigation
              size={16}
              color="#2563EB"
              style={isGettingLocation ? styles.rotating : undefined}
            />
            <Text style={styles.getCurrentLocationText}>
              {isGettingLocation ? 'Getting location...' : 'Current'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageList}
        >
          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => setImages(images.filter((_, i) => i !== index))}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={pickImages} style={styles.addImageButton}>
            <ImageIcon size={24} color="#2563EB" />
            <Text style={styles.addImageText}>Add Photos</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.contentContainer}>
          <TextInput
            style={styles.contentInput}
            placeholder="Write about your day..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
          />
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.micButtonRecording]}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Mic size={24} color={isRecording ? '#FFFFFF' : '#2563EB'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: '#1E293B',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleInput: {
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
    color: '#1E293B',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  locationInput: {
    flex: 1,
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  getCurrentLocation: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gettingLocation: {
    backgroundColor: '#F1F5F9',
  },
  getCurrentLocationText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: '#2563EB',
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  imageList: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 120,
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#2563EB',
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  contentInput: {
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    color: '#1E293B',
    height: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    paddingRight: 56,
    lineHeight: 24,
  },
  micButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#DC2626',
  },
});
