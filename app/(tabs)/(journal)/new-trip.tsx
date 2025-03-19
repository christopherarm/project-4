import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Calendar, MapPin, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Trip } from '@/libs/models/Trip';
import { useDatabase } from '@/libs/context/DatabaseContext';
import { parse, isValid, format } from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { de } from 'date-fns/locale';

export default function NewTripScreen() {
  const { isInitialized, syncData } = useDatabase();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [destinations, setDestinations] = useState(['']);
  const [coverImage, setCoverImage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

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

  // Date Picker Handler
  const showStartDatePicker = () => {
    setStartDatePickerVisible(true);
  };

  const showEndDatePicker = () => {
    setEndDatePickerVisible(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisible(false);
  };

  const hideEndDatePicker = () => {
    setEndDatePickerVisible(false);
  };

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(format(date, 'dd.MM.yyyy'));
    hideStartDatePicker();
  };

  const handleEndDateConfirm = (date: Date) => {
    setEndDate(format(date, 'dd.MM.yyyy'));
    hideEndDatePicker();
  };

  // Formatiere Datumseingabe
  const formatDate = (dateString: string): Date | null => {
    try {
      // Versuche Datumsformat "DD.MM.YYYY" zu parsen
      const parsedDate = parse(dateString, 'dd.MM.yyyy', new Date());

      if (isValid(parsedDate)) {
        return parsedDate;
      }

      // Versuche alternatives Format "DD/MM/YYYY"
      const alternativeParsed = parse(dateString, 'dd/MM/yyyy', new Date());

      if (isValid(alternativeParsed)) {
        return alternativeParsed;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Validiere das Formular
  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Titel für deine Reise ein.');
      return false;
    }

    if (startDate) {
      const parsedStartDate = formatDate(startDate);
      if (!parsedStartDate) {
        Alert.alert(
          'Fehler',
          'Bitte gib ein gültiges Startdatum im Format TT.MM.JJJJ ein.'
        );
        return false;
      }
    }

    if (endDate) {
      const parsedEndDate = formatDate(endDate);
      if (!parsedEndDate) {
        Alert.alert(
          'Fehler',
          'Bitte gib ein gültiges Enddatum im Format TT.MM.JJJJ ein.'
        );
        return false;
      }
    }

    if (startDate && endDate) {
      const parsedStartDate = formatDate(startDate);
      const parsedEndDate = formatDate(endDate);

      if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
        Alert.alert(
          'Fehler',
          'Das Startdatum kann nicht nach dem Enddatum liegen.'
        );
        return false;
      }
    }

    return true;
  };

  // Speichere die Reise
  const saveTrip = async () => {
    if (!isInitialized) {
      Alert.alert('Fehler', 'Datenbank ist noch nicht initialisiert.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsCreating(true);

      // Bereite Daten vor
      const parsedStartDate = startDate ? formatDate(startDate) : null;
      const parsedEndDate = endDate ? formatDate(endDate) : null;

      // Erstelle neue Trip-Instanz
      const newTrip = new Trip({
        title: title.trim(),
        description: destinations.filter((d) => d.trim()).join(', '),
        start_date: parsedStartDate ? parsedStartDate.toISOString() : undefined,
        end_date: parsedEndDate ? parsedEndDate.toISOString() : undefined,
      });

      // Speichere in der Datenbank
      await newTrip.save();
      console.log('Trip erfolgreich gespeichert:', newTrip.id);

      // Starte automatisch die Synchronisierung im Hintergrund
      try {
        console.log(
          'Starte automatische Synchronisierung nach Trip-Erstellung...'
        );
        // Wir führen die Synchronisierung asynchron durch, ohne auf das Ergebnis zu warten,
        // damit die Navigation nicht verzögert wird
        syncData()
          .then((result) => {
            console.log('Automatische Synchronisierung abgeschlossen:', result);
          })
          .catch((syncError) => {
            console.error(
              'Fehler bei automatischer Synchronisierung:',
              syncError
            );
          });
      } catch (syncError) {
        console.error('Fehler beim Starten der Synchronisierung:', syncError);
      }

      // Navigiere zurück zur Trip-Liste
      router.replace('/(tabs)/(journal)');
    } catch (error) {
      console.error('Fehler beim Speichern der Reise:', error);
      Alert.alert(
        'Fehler',
        'Beim Speichern der Reise ist ein Fehler aufgetreten. Bitte versuche es erneut.'
      );
    } finally {
      setIsCreating(false);
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
        <Text style={styles.headerTitle}>New Trip</Text>
        <TouchableOpacity
          style={[styles.saveButton, isCreating && styles.disabledButton]}
          onPress={saveTrip}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.titleInput}
          placeholder="Trip Title"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.dateContainer}>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={showStartDatePicker}
            activeOpacity={0.7}
          >
            <Calendar size={20} color="#2563EB" />
            <Text
              style={[
                styles.dateText,
                !startDate && styles.dateTextPlaceholder,
              ]}
            >
              {startDate || 'Start Date'}
            </Text>
          </TouchableOpacity>
          <View style={styles.dateSeparator} />
          <TouchableOpacity
            style={styles.dateInput}
            onPress={showEndDatePicker}
            activeOpacity={0.7}
          >
            <Calendar size={20} color="#2563EB" />
            <Text
              style={[styles.dateText, !endDate && styles.dateTextPlaceholder]}
            >
              {endDate || 'End Date'}
            </Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isStartDatePickerVisible}
          mode="date"
          onConfirm={handleStartDateConfirm}
          onCancel={hideStartDatePicker}
          locale="de"
          confirmTextIOS="Bestätigen"
          cancelTextIOS="Abbrechen"
        />

        <DateTimePickerModal
          isVisible={isEndDatePickerVisible}
          mode="date"
          onConfirm={handleEndDateConfirm}
          onCancel={hideEndDatePicker}
          locale="de"
          confirmTextIOS="Bestätigen"
          cancelTextIOS="Abbrechen"
          minimumDate={
            startDate ? formatDate(startDate) || undefined : undefined
          }
        />

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
                  style={styles.removeDestination}
                >
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={addDestination}
            style={styles.addDestination}
          >
            <Text style={styles.addDestinationText}>
              + Add another destination
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover Image</Text>
          <TouchableOpacity onPress={pickImage} style={styles.coverImageButton}>
            {coverImage ? (
              <Text style={styles.coverImageSelectedText}>Image selected</Text>
            ) : (
              <>
                <ImageIcon size={24} color="#2563EB" />
                <Text style={styles.coverImageText}>Choose cover image</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.imageSupportText}>
            Note: Image support is currently in development. Images will be
            added in a future update.
          </Text>
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
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontFamily: 'Nunito-Bold',
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
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  dateTextPlaceholder: {
    color: '#94A3B8',
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
    fontFamily: 'Nunito-Bold',
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
    fontFamily: 'Nunito-Regular',
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
    fontFamily: 'Nunito-SemiBold',
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
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#2563EB',
  },
  coverImageSelectedText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#10B981',
  },
  imageSupportText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});
