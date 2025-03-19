import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { initDatabase } from '../database/sqliteClient';
import { SyncManager, SyncResult } from '../utils/sync/SyncManager';
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { ensureAuthenticated } from '../database/supabaseClient';

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

// Intervall für automatische Synchronisierung in Millisekunden (5 Minuten)
const AUTO_SYNC_INTERVAL = 5 * 60 * 1000;

export const DatabaseProvider = ({ children }: DatabaseProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSync, setIsSync] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Letzte Netzwerkverbindung speichern
  const isConnectedRef = useRef<boolean | null>(null);
  // Timer für automatische Synchronisierung
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Flag um zu verhindern, dass zu viele Syncs gleichzeitig gestartet werden
  const isSyncInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Datenbank initialisieren
        await initDatabase();

        // Stelle sicher, dass der Benutzer bei Supabase authentifiziert ist
        await ensureAuthenticated();

        setIsInitialized(true);

        // Nach Initialisierung ersten Sync versuchen
        const networkState = await NetInfo.fetch();
        isConnectedRef.current = networkState.isConnected;

        if (networkState.isConnected) {
          syncData();
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Unknown database error');
      }
    };

    initialize();

    // Netzwerkstatusänderungen überwachen
    let netInfoUnsubscribe: NetInfoSubscription | null = null;

    const setupNetworkListener = () => {
      netInfoUnsubscribe = NetInfo.addEventListener(handleNetworkChange);
    };

    setupNetworkListener();

    // AppState-Änderungen überwachen (für Wiederaufnahme aus Hintergrund)
    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Timer für regelmäßige Synchronisierung
    startAutoSyncTimer();

    // Cleanup
    return () => {
      if (netInfoUnsubscribe) netInfoUnsubscribe();
      appStateSubscription.remove();
      stopAutoSyncTimer();
    };
  }, []);

  // Netzwerkstatusänderung
  const handleNetworkChange = (state: NetInfoState) => {
    const isNowConnected = state.isConnected;

    console.log(
      `Netzwerkstatus geändert: ${isNowConnected ? 'Verbunden' : 'Getrennt'}`
    );

    // Wenn Verbindung wiederhergestellt wurde, synchronisieren
    if (isNowConnected && !isConnectedRef.current) {
      console.log(
        'Netzwerkverbindung wiederhergestellt, starte Synchronisierung...'
      );
      syncData();
    }

    isConnectedRef.current = isNowConnected;
  };

  // App-Zustandsänderung
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('App wieder im Vordergrund, prüfe auf Sync-Bedarf...');
      checkAndSyncIfNeeded();
    }
  };

  // Timer für automatische Synchronisierung starten
  const startAutoSyncTimer = () => {
    stopAutoSyncTimer(); // Vorherigen Timer stoppen

    autoSyncTimerRef.current = setInterval(() => {
      console.log('Automatischer Sync-Timer ausgelöst');
      checkAndSyncIfNeeded();
    }, AUTO_SYNC_INTERVAL);

    console.log('Automatischer Sync-Timer gestartet');
  };

  // Timer stoppen
  const stopAutoSyncTimer = () => {
    if (autoSyncTimerRef.current) {
      clearInterval(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }
  };

  // Prüfen und synchronisieren, wenn Bedingungen erfüllt sind
  const checkAndSyncIfNeeded = async () => {
    if (!isInitialized || isSyncInProgressRef.current || isSync) {
      console.log(
        'Sync nicht möglich: DB nicht initialisiert oder Sync läuft bereits'
      );
      return;
    }

    const networkState = await NetInfo.fetch();
    if (networkState.isConnected) {
      console.log('Auto-Sync: Netzwerk verfügbar, starte Synchronisierung');
      syncData();
    } else {
      console.log('Auto-Sync: Keine Netzwerkverbindung, Sync abgebrochen');
    }
  };

  /**
   * Führt eine manuelle oder automatische Synchronisierung durch
   */
  const syncData = async (): Promise<SyncResult> => {
    try {
      // Wenn bereits eine Synchronisierung läuft, abbrechen
      if (isSyncInProgressRef.current || isSync) {
        console.log('Synchronisierung bereits im Gange, wird übersprungen');
        return {
          success: false,
          error: 'Eine andere Synchronisierung läuft bereits',
        };
      }

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

      // Synchronisierung als gestartet markieren
      isSyncInProgressRef.current = true;
      setIsSync(true);
      setError(null);

      console.log('Starte Synchronisierung...');

      // Führe Synchronisierung durch
      const result = await SyncManager.syncAll();
      console.log('Synchronisierung abgeschlossen:', result);

      setLastSyncResult(result);

      if (!result.success) {
        setError(result.error || 'Unbekannter Synchronisierungsfehler');
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('Synchronisierungsfehler:', errorMessage);
      setError(errorMessage);

      const result = {
        success: false,
        error: errorMessage,
      } as SyncResult;

      setLastSyncResult(result);
      return result;
    } finally {
      setIsSync(false);
      isSyncInProgressRef.current = false;
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
