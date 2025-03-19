import { supabase, ensureAuthenticated } from '../../database/supabaseClient';
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
      // Stelle sicher, dass der Benutzer authentifiziert ist, bevor wir die Synchronisierung starten
      const isAuthenticated = await ensureAuthenticated();
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Authentifizierung fehlgeschlagen'
        };
      }
      
      // Prüfe, ob die Supabase-Verbindung funktioniert
      const connectionTest = await this.testSupabaseConnection();
      if (!connectionTest.success) {
        return {
          success: false,
          error: `Keine Verbindung zu Supabase: ${connectionTest.error}`
        };
      }
      
      console.log('Starte Synchronisierung mit Supabase...');
      
      // Speichere lokale Änderungen in Supabase
      const uploadResult = await this.uploadLocalChanges();
      console.log(`Upload abgeschlossen: ${uploadResult.trips} Trips, ${uploadResult.entries} Entries`);
      
      // Hole Änderungen von Supabase
      const downloadResult = await this.downloadRemoteChanges();
      console.log(`Download abgeschlossen: ${downloadResult.trips} Trips, ${downloadResult.entries} Entries`);
      
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
   * Testet die Verbindung zum Supabase-Server
   */
  private static async testSupabaseConnection(): Promise<{success: boolean, error?: string}> {
    try {
      // Versuche eine einfache Abfrage an Supabase
      const { error } = await supabase.from('trips').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Supabase connection test error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  /**
   * Lädt lokale Änderungen zu Supabase hoch
   */
  private static async uploadLocalChanges(): Promise<{ trips: number, entries: number }> {
    // Finde lokale Trips, die noch nicht synchronisiert wurden
    const unsyncedTrips = await Trip.findUnsyncedTrips();
    console.log(`${unsyncedTrips.length} unsynced trips gefunden`);
    let uploadedTrips = 0;
    
    // Synchronisiere jeden Trip
    for (const trip of unsyncedTrips) {
      try {
        console.log(`Synchronisiere Trip: ${trip.id} (${trip.title})`);
        
        const tripData = {
          id: trip.id,
          title: trip.title,
          description: trip.description,
          start_date: trip.start_date,
          end_date: trip.end_date,
          created_at: trip.created_at,
          updated_at: trip.updated_at,
          deleted: trip.deleted ? 1 : 0
        };
        
        // Lösche oder aktualisiere den Trip in Supabase
        if (trip.deleted) {
          // Soft Delete in Supabase
          const { error } = await supabase.from('trips')
            .update({ deleted: true, updated_at: trip.updated_at })
            .eq('id', trip.id);
            
          if (error) throw new Error(`Supabase update error: ${error.message}`);
          console.log(`Trip ${trip.id} als gelöscht markiert`);
        } else {
          // Füge ein oder aktualisiere den Trip in Supabase
          const { error } = await supabase.from('trips')
            .upsert(tripData, { onConflict: 'id' });
            
          if (error) throw new Error(`Supabase upsert error: ${error.message}`);
          console.log(`Trip ${trip.id} erfolgreich hochgeladen/aktualisiert`);
        }
        
        // Markiere den Trip als synchronisiert
        await executeQuery(
          'UPDATE trips SET sync_status = ? WHERE id = ?',
          ['synced', trip.id]
        );
        
        uploadedTrips++;
      } catch (error) {
        console.error(`Error syncing trip ${trip.id}:`, error);
        await executeQuery(
          'UPDATE trips SET sync_status = ? WHERE id = ?',
          ['failed', trip.id]
        );
      }
    }
    
    // Finde lokale Entries, die noch nicht synchronisiert wurden
    const unsyncedEntries = await Entry.findUnsyncedEntries();
    console.log(`${unsyncedEntries.length} unsynced entries gefunden`);
    let uploadedEntries = 0;
    
    // Synchronisiere jeden Entry
    for (const entry of unsyncedEntries) {
      try {
        console.log(`Synchronisiere Entry: ${entry.id} (${entry.title})`);
        
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
          deleted: entry.deleted ? 1 : 0
        };
        
        // Lösche oder aktualisiere den Entry in Supabase
        if (entry.deleted) {
          // Soft Delete in Supabase
          const { error } = await supabase.from('entries')
            .update({ deleted: true, updated_at: entry.updated_at })
            .eq('id', entry.id);
            
          if (error) throw new Error(`Supabase update error: ${error.message}`);
          console.log(`Entry ${entry.id} als gelöscht markiert`);
        } else {
          // Füge ein oder aktualisiere den Entry in Supabase
          const { error } = await supabase.from('entries')
            .upsert(entryData, { onConflict: 'id' });
            
          if (error) throw new Error(`Supabase upsert error: ${error.message}`);
          console.log(`Entry ${entry.id} erfolgreich hochgeladen/aktualisiert`);
        }
        
        // Markiere den Entry als synchronisiert
        await executeQuery(
          'UPDATE entries SET sync_status = ? WHERE id = ?',
          ['synced', entry.id]
        );
        
        uploadedEntries++;
      } catch (error) {
        console.error(`Error syncing entry ${entry.id}:`, error);
        await executeQuery(
          'UPDATE entries SET sync_status = ? WHERE id = ?',
          ['failed', entry.id]
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
    console.log(`Hole Änderungen seit: ${lastSync || '1970-01-01'}`);
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
      console.log(`${trips.length} Trips von Supabase geladen`);
      
      // Aktualisiere lokale Datenbank mit Remote-Trips
      for (const tripData of trips) {
        try {
          console.log(`Verarbeite Remote-Trip: ${tripData.id} (${tripData.title})`);
          
          // Prüfe, ob der Trip lokal existiert
          const result = await executeQuery(
            'SELECT id, sync_status FROM trips WHERE id = ?',
            [tripData.id]
          );
          
          const localTripExists = result.rows.length > 0;
          const localSyncStatus = localTripExists ? result.rows[0].sync_status : null;
          
          // Bei lokalen Änderungen (pending) haben diese Vorrang
          if (localTripExists && localSyncStatus === 'pending') {
            console.log(`Trip ${tripData.id} hat lokale Änderungen, überspringe Update`);
            continue;
          }
          
          if (localTripExists) {
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
            console.log(`Trip ${tripData.id} lokal aktualisiert`);
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
            console.log(`Neuer Trip ${tripData.id} lokal angelegt`);
          }
          
          downloadedTrips++;
        } catch (error) {
          console.error(`Error updating local trip ${tripData.id}:`, error);
        }
      }
    } else {
      console.log('Keine neuen Trips von Supabase zu laden');
    }
    
    // Hole aktualisierte Entries von Supabase
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .gt('updated_at', lastSync || '1970-01-01');
    
    if (entriesError) {
      console.error('Error fetching remote entries:', entriesError);
    } else if (entries && entries.length > 0) {
      console.log(`${entries.length} Entries von Supabase geladen`);
      
      // Aktualisiere lokale Datenbank mit Remote-Entries
      for (const entryData of entries) {
        try {
          console.log(`Verarbeite Remote-Entry: ${entryData.id} (${entryData.title})`);
          
          // Prüfe, ob der Entry lokal existiert
          const result = await executeQuery(
            'SELECT id, sync_status FROM entries WHERE id = ?',
            [entryData.id]
          );
          
          const localEntryExists = result.rows.length > 0;
          const localSyncStatus = localEntryExists ? result.rows[0].sync_status : null;
          
          // Bei lokalen Änderungen (pending) haben diese Vorrang
          if (localEntryExists && localSyncStatus === 'pending') {
            console.log(`Entry ${entryData.id} hat lokale Änderungen, überspringe Update`);
            continue;
          }
          
          if (localEntryExists) {
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
            console.log(`Entry ${entryData.id} lokal aktualisiert`);
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
            console.log(`Neuer Entry ${entryData.id} lokal angelegt`);
          }
          
          downloadedEntries++;
        } catch (error) {
          console.error(`Error updating local entry ${entryData.id}:`, error);
        }
      }
    } else {
      console.log('Keine neuen Entries von Supabase zu laden');
    }
    
    return { trips: downloadedTrips, entries: downloadedEntries };
  }

  /**
   * Aktualisiert den Zeitpunkt der letzten Synchronisierung
   */
  private static async updateLastSyncTimestamp(): Promise<void> {
    const now = new Date().toISOString();
    console.log(`Setze letzten Sync-Zeitpunkt auf: ${now}`);
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