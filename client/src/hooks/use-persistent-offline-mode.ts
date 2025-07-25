import { useState, useEffect } from 'react';
import { offlineStorage } from '@/lib/offline-storage';

export function usePersistentOfflineMode() {
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load offline mode state from storage on component mount
  useEffect(() => {
    const loadOfflineState = () => {
      try {
        const settings = offlineStorage.getSettings();
        const savedOfflineMode = settings?.offlineMode || false;
        setIsOfflineMode(savedOfflineMode);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load offline mode state:', error);
        setIsOfflineMode(false);
        setIsInitialized(true);
      }
    };

    loadOfflineState();
  }, []);

  // Save offline mode state to storage whenever it changes
  const toggleOfflineMode = (newMode?: boolean) => {
    const targetMode = newMode !== undefined ? newMode : !isOfflineMode;
    
    try {
      setIsOfflineMode(targetMode);
      offlineStorage.saveSettings({ offlineMode: targetMode });
      
      // Also store in localStorage as backup
      localStorage.setItem('meshbook_offline_mode', JSON.stringify(targetMode));
      
      console.log(`Offline mode ${targetMode ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to save offline mode state:', error);
    }
  };

  // Check if browser is actually offline
  const [isNetworkOffline, setIsNetworkOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsNetworkOffline(false);
    const handleOffline = () => setIsNetworkOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine effective offline status (manual mode OR network offline)
  const isEffectivelyOffline = isOfflineMode || isNetworkOffline;

  // Sync with server when coming back online
  useEffect(() => {
    if (!isNetworkOffline && isInitialized && !isOfflineMode) {
      // Attempt to sync offline data with server
      const syncOfflineData = async () => {
        try {
          const success = await offlineStorage.syncWithServer('/api');
          if (success) {
            console.log('Successfully synced offline data with server');
          }
        } catch (error) {
          console.error('Failed to sync with server:', error);
        }
      };

      syncOfflineData();
    }
  }, [isNetworkOffline, isInitialized, isOfflineMode]);

  // Restore state from localStorage as fallback
  useEffect(() => {
    if (!isInitialized) {
      try {
        const savedMode = localStorage.getItem('meshbook_offline_mode');
        if (savedMode !== null) {
          const parsedMode = JSON.parse(savedMode);
          setIsOfflineMode(parsedMode);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to restore offline mode from localStorage:', error);
        setIsInitialized(true);
      }
    }
  }, [isInitialized]);

  return {
    isOfflineMode,
    isNetworkOffline,
    isEffectivelyOffline,
    isInitialized,
    toggleOfflineMode,
    setOfflineMode: (mode: boolean) => toggleOfflineMode(mode)
  };
}

export default usePersistentOfflineMode;