import { BaseModel } from './BaseModel';
import { executeQuery } from '../database/sqliteClient';

/**
 * Trip-Modell repräsentiert eine Reise
 */
export class Trip extends BaseModel {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;

  /**
   * Initialisiert ein neues Trip-Objekt
   */
  constructor(data?: Partial<Trip>) {
    super(data);
    this.title = data?.title || '';
    this.description = data?.description;
    this.start_date = data?.start_date;
    this.end_date = data?.end_date;
  }

  /**
   * Speichert einen Trip in der Datenbank
   */
  async save(): Promise<void> {
    const data = this.prepareForDb();
    
    await executeQuery(
      `INSERT INTO trips (
        id, title, description, start_date, end_date,
        created_at, updated_at, sync_status, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id, data.title, data.description, data.start_date, data.end_date,
        data.created_at, data.updated_at, data.sync_status, data.deleted
      ]
    );

    await this.createSyncLogEntry('create');
  }

  /**
   * Aktualisiert einen Trip in der Datenbank
   */
  async update(newData: Partial<Trip>): Promise<void> {
    // Aktualisiere Objektdaten
    if (newData.title !== undefined) this.title = newData.title;
    if (newData.description !== undefined) this.description = newData.description;
    if (newData.start_date !== undefined) this.start_date = newData.start_date;
    if (newData.end_date !== undefined) this.end_date = newData.end_date;
    
    this.sync_status = 'pending';
    this.updateTimestamp();
    
    const data = this.prepareForDb();
    
    await executeQuery(
      `UPDATE trips SET 
        title = ?, description = ?, start_date = ?, end_date = ?,
        updated_at = ?, sync_status = ?
      WHERE id = ?`,
      [
        data.title, data.description, data.start_date, data.end_date,
        data.updated_at, data.sync_status, data.id
      ]
    );

    await this.createSyncLogEntry('update');
  }

  /**
   * Löscht einen Trip aus der Datenbank (Soft Delete)
   */
  async delete(): Promise<void> {
    this.markAsDeleted();
    const data = this.prepareForDb();
    
    await executeQuery(
      'UPDATE trips SET deleted = ?, updated_at = ?, sync_status = ? WHERE id = ?',
      [data.deleted, data.updated_at, data.sync_status, data.id]
    );

    await this.createSyncLogEntry('delete');
  }

  /**
   * Findet einen Trip anhand seiner ID
   */
  static async findById(id: string): Promise<Trip | null> {
    const result = await executeQuery(
      'SELECT * FROM trips WHERE id = ? AND deleted = 0',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Trip(result.rows[0]);
  }

  /**
   * Findet alle nicht gelöschten Trips
   */
  static async findAll(): Promise<Trip[]> {
    const result = await executeQuery(
      'SELECT * FROM trips WHERE deleted = 0 ORDER BY created_at DESC',
      []
    );
    
    return result.rows.map(row => new Trip(row));
  }

  /**
   * Findet Trips, die noch nicht synchronisiert wurden
   */
  static async findUnsyncedTrips(): Promise<Trip[]> {
    const result = await executeQuery(
      'SELECT * FROM trips WHERE sync_status = ? ORDER BY updated_at ASC',
      ['pending']
    );
    
    return result.rows.map(row => new Trip(row));
  }
} 