import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { initDatabase } from '../database/sqliteClient';
import { SyncManager, SyncResult } from '../utils/sync/SyncManager';
import NetInfo from '@react-native-community/netinfo';

interface DatabaseContextProps {
  isInitialized: boolean;
  isSync: boolean;
  syncData: () => Promise<SyncResult>;
  lastSyncResult: SyncResult | null;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextProps | undefined>(
  undefined
);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider = ({ children }: DatabaseProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSync, setIsSync] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Datenbank initialisieren
        await initDatabase();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Unknown database error');
      }
    };

    initialize();
  }, []);

  /**
   * Führt eine manuelle Synchronisierung durch
   */
  const syncData = async (): Promise<SyncResult> => {
    try {
      // Überprüfe Netzwerkverbindung
      const networkState = await NetInfo.fetch();

      if (!networkState.isConnected) {
        const result = {
          success: false,
          error: 'Keine Internetverbindung verfügbar',
        } as SyncResult;

        setError('Keine Internetverbindung verfügbar');
        setLastSyncResult(result);
        return result;
      }

      setIsSync(true);
      setError(null);

      // Führe Synchronisierung durch
      const result = await SyncManager.syncAll();

      setLastSyncResult(result);

      if (!result.success) {
        setError(result.error || 'Unbekannter Synchronisierungsfehler');
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);

      const result = {
        success: false,
        error: errorMessage,
      } as SyncResult;

      setLastSyncResult(result);
      return result;
    } finally {
      setIsSync(false);
    }
  };

  const value = {
    isInitialized,
    isSync,
    syncData,
    lastSyncResult,
    error,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextProps => {
  const context = useContext(DatabaseContext);

  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }

  return context;
};
