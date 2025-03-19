import 'react-native-get-random-values'; // Polyfill für crypto.getRandomValues()
import { executeQuery } from '../database/sqliteClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Basismodell für alle Datenmodelle
 */
export abstract class BaseModel {
  id: string;
  created_at: string;
  updated_at: string;
  sync_status: 'synced' | 'pending' | 'failed';
  deleted: boolean;

  /**
   * Initialisiert ein neues Modell
   */
  constructor(data?: Partial<BaseModel>) {
    this.id = data?.id || uuidv4();
    this.created_at = data?.created_at || new Date().toISOString();
    this.updated_at = data?.updated_at || new Date().toISOString();
    this.sync_status = data?.sync_status || 'pending';
    this.deleted = data?.deleted || false;
  }

  /**
   * Aktualisiert das updated_at Feld
   */
  updateTimestamp(): void {
    this.updated_at = new Date().toISOString();
  }

  /**
   * Markiert ein Objekt als gelöscht
   */
  markAsDeleted(): void {
    this.deleted = true;
    this.sync_status = 'pending';
    this.updateTimestamp();
  }

  /**
   * Aktualisiert den Synchronisierungsstatus
   */
  updateSyncStatus(status: 'synced' | 'pending' | 'failed'): void {
    this.sync_status = status;
    this.updateTimestamp();
  }

  /**
   * Bereitet Objektdaten für die Datenbank vor
   */
  prepareForDb(): Record<string, any> {
    const data: Record<string, any> = { ...this };
    // Konvertiere boolean zu integer für SQLite
    data.deleted = this.deleted ? 1 : 0;
    return data;
  }

  /**
   * Vom konkreten Modell zu implementieren, um ein Objekt zu speichern
   */
  abstract save(): Promise<void>;

  /**
   * Vom konkreten Modell zu implementieren, um ein Objekt zu aktualisieren
   */
  abstract update(data: Partial<any>): Promise<void>;

  /**
   * Vom konkreten Modell zu implementieren, um ein Objekt zu löschen
   */
  abstract delete(): Promise<void>;

  /**
   * Erstellt einen Eintrag im Sync-Log
   */
  protected async createSyncLogEntry(action: 'create' | 'update' | 'delete'): Promise<void> {
    const timestamp = new Date().toISOString();
    const entityType = this.constructor.name;
    
    await executeQuery(
      'INSERT INTO sync_log (entity_type, entity_id, action, status, timestamp) VALUES (?, ?, ?, ?, ?)',
      [entityType, this.id, action, 'pending', timestamp]
    );
  }
} 