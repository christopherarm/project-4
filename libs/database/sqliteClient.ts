import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Definition der Typen für das Ergebnis einer SQL-Abfrage
export interface SQLResult {
  rows: any[];
  rowsAffected?: number;
  insertId?: number;
}

/**
 * Öffnet die SQLite-Datenbank
 * @param name Name der Datenbank
 */
export function getDatabase(name: string = 'travelapp.db') {
  if (Platform.OS === 'web') {
    throw new Error('SQLite is not supported on web platform');
  }
  return SQLite.openDatabaseSync(name);
}

// Singleton-Instanz für die Hauptdatenbank
export const db = getDatabase();

/**
 * Führt eine SQL-Abfrage aus
 * @param query SQL-Abfrage
 * @param params Parameter für die Abfrage
 * @returns Promise mit dem Ergebnis der Abfrage
 */
export const executeQuery = async (
  query: string, 
  params: any[] = []
): Promise<SQLResult> => {
  try {
    const isSelect = query.trim().toLowerCase().startsWith('select');
    
    if (isSelect) {
      // Für SELECT-Abfragen
      const results = await db.getAllAsync(query, params);
      return { rows: results };
    } else {
      // Für INSERT, UPDATE, DELETE etc.
      const result = await db.runAsync(query, params);
      return {
        rows: [],
        rowsAffected: result.changes,
        insertId: result.lastInsertRowId
      };
    }
  } catch (error) {
    console.error('SQLite Error:', error);
    throw error;
  }
};

/**
 * Initialisiert die Datenbank-Tabellen
 */
export const initDatabase = async (): Promise<void> => {
  // Erstelle Tabelle für Trips (Reisen)
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      deleted INTEGER DEFAULT 0
    )
  `);

  // Erstelle Tabelle für Entries (Einträge)
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    )
  `);

  // Erstelle Sync-Log-Tabelle
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Führe eine Test-Abfrage aus, um zu prüfen, ob die Datenbank funktioniert
  const result = await executeQuery('SELECT name FROM sqlite_master WHERE type="table"');
  console.log('Datenbanktabellen:', result.rows);
}; 