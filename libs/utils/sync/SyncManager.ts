import { supabase } from '../../database/supabaseClient';
import { executeQuery } from '../../database/sqliteClient';
import { Trip } from '../../models/Trip';
import { Entry } from '../../models/Entry';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SYNC_KEY = 'last_sync_timestamp';

/**
 * SyncManager verwaltet die Synchronisierung zwischen lokalem SQLite und Supabase
 */
export class SyncManager {
  /**
   * Führt eine vollständige Synchronisierung durch
   */
  static async syncAll(): Promise<SyncResult> {
    try {
      // Speichere lokale Änderungen in Supabase
      const uploadResult = await this.uploadLocalChanges();
      
      // Hole Änderungen von Supabase
      const downloadResult = await this.downloadRemoteChanges();
      
      // Speichere den Zeitpunkt der letzten Synchronisierung
      await this.updateLastSyncTimestamp();
      
      return {
        success: true,
        uploadedTrips: uploadResult.trips,
        uploadedEntries: uploadResult.entries,
        downloadedTrips: downloadResult.trips,
        downloadedEntries: downloadResult.entries
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    }
  }

  /**
   * Lädt lokale Änderungen zu Supabase hoch
   */
  private static async uploadLocalChanges(): Promise<{ trips: number, entries: number }> {
    // Finde lokale Trips, die noch nicht synchronisiert wurden
    const unsyncedTrips = await Trip.findUnsyncedTrips();
    let uploadedTrips = 0;
    
    // Synchronisiere jeden Trip
    for (const trip of unsyncedTrips) {
      try {
        const tripData = {
          id: trip.id,
          title: trip.title,
          description: trip.description,
          start_date: trip.start_date,
          end_date: trip.end_date,
          created_at: trip.created_at,
          updated_at: trip.updated_at,
          deleted: trip.deleted
        };
        
        // Lösche oder aktualisiere den Trip in Supabase
        if (trip.deleted) {
          // Soft Delete in Supabase
          await supabase.from('trips')
            .update({ deleted: true, updated_at: trip.updated_at })
            .eq('id', trip.id);
        } else {
          // Füge ein oder aktualisiere den Trip in Supabase
          await supabase.from('trips')
            .upsert(tripData, { onConflict: 'id' });
        }
        
        // Markiere den Trip als synchronisiert
        trip.updateSyncStatus('synced');
        const data = trip.prepareForDb();
        await executeQuery(
          'UPDATE trips SET sync_status = ? WHERE id = ?',
          [data.sync_status, data.id]
        );
        
        uploadedTrips++;
      } catch (error) {
        console.error(`Error syncing trip ${trip.id}:`, error);
        trip.updateSyncStatus('failed');
        const data = trip.prepareForDb();
        await executeQuery(
          'UPDATE trips SET sync_status = ? WHERE id = ?',
          [data.sync_status, data.id]
        );
      }
    }
    
    // Finde lokale Entries, die noch nicht synchronisiert wurden
    const unsyncedEntries = await Entry.findUnsyncedEntries();
    let uploadedEntries = 0;
    
    // Synchronisiere jeden Entry
    for (const entry of unsyncedEntries) {
      try {
        const entryData = {
          id: entry.id,
          trip_id: entry.trip_id,
          title: entry.title,
          content: entry.content,
          location: entry.location,
          latitude: entry.latitude,
          longitude: entry.longitude,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          deleted: entry.deleted
        };
        
        // Lösche oder aktualisiere den Entry in Supabase
        if (entry.deleted) {
          // Soft Delete in Supabase
          await supabase.from('entries')
            .update({ deleted: true, updated_at: entry.updated_at })
            .eq('id', entry.id);
        } else {
          // Füge ein oder aktualisiere den Entry in Supabase
          await supabase.from('entries')
            .upsert(entryData, { onConflict: 'id' });
        }
        
        // Markiere den Entry als synchronisiert
        entry.updateSyncStatus('synced');
        const data = entry.prepareForDb();
        await executeQuery(
          'UPDATE entries SET sync_status = ? WHERE id = ?',
          [data.sync_status, data.id]
        );
        
        uploadedEntries++;
      } catch (error) {
        console.error(`Error syncing entry ${entry.id}:`, error);
        entry.updateSyncStatus('failed');
        const data = entry.prepareForDb();
        await executeQuery(
          'UPDATE entries SET sync_status = ? WHERE id = ?',
          [data.sync_status, data.id]
        );
      }
    }
    
    return { trips: uploadedTrips, entries: uploadedEntries };
  }

  /**
   * Lädt Remote-Änderungen von Supabase herunter
   */
  private static async downloadRemoteChanges(): Promise<{ trips: number, entries: number }> {
    // Letzter Synchronisierungszeitpunkt
    const lastSync = await this.getLastSyncTimestamp();
    let downloadedTrips = 0;
    let downloadedEntries = 0;
    
    // Hole aktualisierte Trips von Supabase
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .gt('updated_at', lastSync || '1970-01-01');
    
    if (tripsError) {
      console.error('Error fetching remote trips:', tripsError);
    } else if (trips && trips.length > 0) {
      // Aktualisiere lokale Datenbank mit Remote-Trips
      for (const tripData of trips) {
        try {
          // Prüfe, ob der Trip lokal existiert
          const localTrip = await Trip.findById(tripData.id);
          
          if (localTrip) {
            // Prüfe, ob der lokale Trip geändert wurde und nicht synchronisiert ist
            if (localTrip.sync_status === 'pending') {
              // Lokale Änderungen haben Vorrang, überspringen
              continue;
            }
            
            // Aktualisiere lokalen Trip
            await executeQuery(
              `UPDATE trips SET 
                title = ?, description = ?, start_date = ?, end_date = ?,
                updated_at = ?, sync_status = ?, deleted = ?
              WHERE id = ?`,
              [
                tripData.title, tripData.description, tripData.start_date, tripData.end_date,
                tripData.updated_at, 'synced', tripData.deleted ? 1 : 0, tripData.id
              ]
            );
          } else {
            // Füge neuen Trip hinzu
            await executeQuery(
              `INSERT INTO trips (
                id, title, description, start_date, end_date,
                created_at, updated_at, sync_status, deleted
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                tripData.id, tripData.title, tripData.description, tripData.start_date, tripData.end_date,
                tripData.created_at, tripData.updated_at, 'synced', tripData.deleted ? 1 : 0
              ]
            );
          }
          
          downloadedTrips++;
        } catch (error) {
          console.error(`Error updating local trip ${tripData.id}:`, error);
        }
      }
    }
    
    // Hole aktualisierte Entries von Supabase
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .gt('updated_at', lastSync || '1970-01-01');
    
    if (entriesError) {
      console.error('Error fetching remote entries:', entriesError);
    } else if (entries && entries.length > 0) {
      // Aktualisiere lokale Datenbank mit Remote-Entries
      for (const entryData of entries) {
        try {
          // Prüfe, ob der Entry lokal existiert
          const localEntry = await Entry.findById(entryData.id);
          
          if (localEntry) {
            // Prüfe, ob der lokale Entry geändert wurde und nicht synchronisiert ist
            if (localEntry.sync_status === 'pending') {
              // Lokale Änderungen haben Vorrang, überspringen
              continue;
            }
            
            // Aktualisiere lokalen Entry
            await executeQuery(
              `UPDATE entries SET 
                trip_id = ?, title = ?, content = ?, location = ?, 
                latitude = ?, longitude = ?, updated_at = ?, 
                sync_status = ?, deleted = ?
              WHERE id = ?`,
              [
                entryData.trip_id, entryData.title, entryData.content, entryData.location,
                entryData.latitude, entryData.longitude, entryData.updated_at,
                'synced', entryData.deleted ? 1 : 0, entryData.id
              ]
            );
          } else {
            // Füge neuen Entry hinzu
            await executeQuery(
              `INSERT INTO entries (
                id, trip_id, title, content, location, latitude, longitude,
                created_at, updated_at, sync_status, deleted
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                entryData.id, entryData.trip_id, entryData.title, entryData.content, 
                entryData.location, entryData.latitude, entryData.longitude,
                entryData.created_at, entryData.updated_at, 'synced', entryData.deleted ? 1 : 0
              ]
            );
          }
          
          downloadedEntries++;
        } catch (error) {
          console.error(`Error updating local entry ${entryData.id}:`, error);
        }
      }
    }
    
    return { trips: downloadedTrips, entries: downloadedEntries };
  }

  /**
   * Speichert den Zeitpunkt der letzten Synchronisierung
   */
  private static async updateLastSyncTimestamp(): Promise<void> {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, now);
  }

  /**
   * Gibt den Zeitpunkt der letzten Synchronisierung zurück
   */
  private static async getLastSyncTimestamp(): Promise<string | null> {
    return await AsyncStorage.getItem(LAST_SYNC_KEY);
  }
}

/**
 * Ergebnis einer Synchronisierung
 */
export interface SyncResult {
  success: boolean;
  uploadedTrips?: number;
  uploadedEntries?: number;
  downloadedTrips?: number;
  downloadedEntries?: number;
  error?: string;
} 