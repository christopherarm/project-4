import { useState } from 'react';
import { SyncManager, SyncResult } from '../utils/sync/SyncManager';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook zur Verwaltung der Datensynchronisierung
 */
export function useSync() {
  const [isSync, setIsSync] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Führt eine manuelle Synchronisierung durch
   */
  const syncData = async () => {
    try {
      // Überprüfe Netzwerkverbindung
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected) {
        setError('Keine Internetverbindung verfügbar');
        return {
          success: false,
          error: 'Keine Internetverbindung verfügbar'
        } as SyncResult;
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
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(errorMessage);
      
      const result = {
        success: false,
        error: errorMessage
      } as SyncResult;
      
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSync(false);
    }
  };

  return {
    syncData,
    isSync,
    lastSyncResult,
    error
  };
} 