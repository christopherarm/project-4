import { useEffect, useState } from 'react';
import { initDatabase } from '../database/sqliteClient';

/**
 * Hook zur Initialisierung der Datenbank und Überwachung des Initialisierungsstatus
 */
export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Datenbank initialisieren
        await initDatabase();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err : new Error('Unknown database error'));
      }
    };

    initialize();
  }, []);

  return { isInitialized, error };
} 