import { BaseModel } from './BaseModel';
import { executeQuery } from '../database/sqliteClient';

/**
 * Entry-Modell repräsentiert einen Reiseeintrag
 */
export class Entry extends BaseModel {
  trip_id: string;
  title: string;
  content?: string;
  location?: string;
  latitude?: number;
  longitude?: number;

  /**
   * Initialisiert ein neues Entry-Objekt
   */
  constructor(data?: Partial<Entry>) {
    super(data);
    this.trip_id = data?.trip_id || '';
    this.title = data?.title || '';
    this.content = data?.content;
    this.location = data?.location;
    this.latitude = data?.latitude;
    this.longitude = data?.longitude;
  }

  /**
   * Speichert einen Entry in der Datenbank
   */
  async save(): Promise<void> {
    const data = this.prepareForDb();
    
    await executeQuery(
      `INSERT INTO entries (
        id, trip_id, title, content, location, latitude, longitude,
        created_at, updated_at, sync_status, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id, data.trip_id, data.title, data.content, data.location, 
        data.latitude, data.longitude, data.created_at, data.updated_at, 
        data.sync_status, data.deleted
      ]
    );

    await this.createSyncLogEntry('create');
  }

  /**
   * Aktualisiert einen Entry in der Datenbank
   */
  async update(newData: Partial<Entry>): Promise<void> {
    // Aktualisiere Objektdaten
    if (newData.title !== undefined) this.title = newData.title;
    if (newData.content !== undefined) this.content = newData.content;
    if (newData.location !== undefined) this.location = newData.location;
    if (newData.latitude !== undefined) this.latitude = newData.latitude;
    if (newData.longitude !== undefined) this.longitude = newData.longitude;
    
    this.sync_status = 'pending';
    this.updateTimestamp();
    
    const data = this.prepareForDb();
    
    await executeQuery(
      `UPDATE entries SET 
        title = ?, content = ?, location = ?, latitude = ?, longitude = ?,
        updated_at = ?, sync_status = ?
      WHERE id = ?`,
      [
        data.title, data.content, data.location, data.latitude, data.longitude,
        data.updated_at, data.sync_status, data.id
      ]
    );

    await this.createSyncLogEntry('update');
  }

  /**
   * Löscht einen Entry aus der Datenbank (Soft Delete)
   */
  async delete(): Promise<void> {
    this.markAsDeleted();
    const data = this.prepareForDb();
    
    await executeQuery(
      'UPDATE entries SET deleted = ?, updated_at = ?, sync_status = ? WHERE id = ?',
      [data.deleted, data.updated_at, data.sync_status, data.id]
    );

    await this.createSyncLogEntry('delete');
  }

  /**
   * Findet einen Entry anhand seiner ID
   */
  static async findById(id: string): Promise<Entry | null> {
    const result = await executeQuery(
      'SELECT * FROM entries WHERE id = ? AND deleted = 0',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Entry(result.rows[0]);
  }

  /**
   * Findet alle Entries zu einer bestimmten Reise
   */
  static async findByTripId(tripId: string): Promise<Entry[]> {
    const result = await executeQuery(
      'SELECT * FROM entries WHERE trip_id = ? AND deleted = 0 ORDER BY created_at DESC',
      [tripId]
    );
    
    return result.rows.map(row => new Entry(row));
  }

  /**
   * Findet Entries, die noch nicht synchronisiert wurden
   */
  static async findUnsyncedEntries(): Promise<Entry[]> {
    const result = await executeQuery(
      'SELECT * FROM entries WHERE sync_status = ? ORDER BY updated_at ASC',
      ['pending']
    );
    
    return result.rows.map(row => new Entry(row));
  }
} 