import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Calendar, MapPin, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function NewTripScreen() {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destinations, setDestinations] = useState(['']);
  const [coverImage, setCoverImage] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const addDestination = () => {
    setDestinations([...destinations, '']);
  };

  const updateDestination = (text: string, index: number) => {
    const newDestinations = [...destinations];
    newDestinations[index] = text;
    setDestinations(newDestinations);
  };

  const removeDestination = (index: number) => {
    if (destinations.length > 1) {
      const newDestinations = destinations.filter((_, i) => i !== index);
      setDestinations(newDestinations);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#64748B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Trip</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.titleInput}
          placeholder="Trip Title"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.dateContainer}>
          <View style={styles.dateInput}>
            <Calendar size={20} color="#2563EB" />
            <TextInput
              style={styles.dateText}
              placeholder="Start Date"
              placeholderTextColor="#94A3B8"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={styles.dateSeparator} />
          <View style={styles.dateInput}>
            <Calendar size={20} color="#2563EB" />
            <TextInput
              style={styles.dateText}
              placeholder="End Date"
              placeholderTextColor="#94A3B8"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinations</Text>
          {destinations.map((destination, index) => (
            <View key={index} style={styles.destinationInput}>
              <MapPin size={20} color="#2563EB" />
              <TextInput
                style={styles.destinationText}
                placeholder="Add destination"
                placeholderTextColor="#94A3B8"
                value={destination}
                onChangeText={(text) => updateDestination(text, index)}
              />
              {destinations.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeDestination(index)}
                  style={styles.removeDestination}>
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={addDestination} style={styles.addDestination}>
            <Text style={styles.addDestinationText}>+ Add another destination</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Image</Text>
          <TouchableOpacity onPress={pickImage} style={styles.coverImageButton}>
            <ImageIcon size={24} color="#2563EB" />
            <Text style={styles.coverImageText}>Choose cover image</Text>
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
    fontFamily: 'Playfair-Bold',
    fontSize: 20,
    color: '#1E293B',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontFamily: 'Playfair-Bold',
    fontSize: 24,
    color: '#1E293B',
    marginBottom: 24,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  dateText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  dateSeparator: {
    width: 20,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Playfair-Bold',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 12,
  },
  destinationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  destinationText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  removeDestination: {
    padding: 4,
  },
  addDestination: {
    paddingVertical: 8,
  },
  addDestinationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#2563EB',
  },
  coverImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 8,
  },
  coverImageText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#2563EB',
  },
});