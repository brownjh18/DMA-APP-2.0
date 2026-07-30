import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '../services/api';
import { Capacitor } from '@capacitor/core';

const CURRENT_APP_VERSION = '1.2.0';

interface VersionInfo {
  latestVersion: string;
  minimumVersion: string;
  releaseDate: string;
  releaseNotes: string[];
  updateUrl: string;
  forceUpdate: boolean;
}

interface AppUpdateContextType {
  currentVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
  forceUpdate: boolean;
  releaseNotes: string[];
  releaseDate: string;
  updateUrl: string;
  isChecking: boolean;
  lastChecked: number | null;
  checkForUpdate: () => Promise<void>;
}

const AppUpdateContext = createContext<AppUpdateContextType | undefined>(undefined);

export const useAppUpdate = () => {
  const context = useContext(AppUpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within an AppUpdateProvider');
  }
  return context;
};

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

interface AppUpdateProviderProps {
  children: ReactNode;
}

export const AppUpdateProvider: React.FC<AppUpdateProviderProps> = ({ children }) => {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<string[]>([]);
  const [releaseDate, setReleaseDate] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(() => {
    const stored = localStorage.getItem('app-update-last-checked');
    return stored ? parseInt(stored, 10) : null;
  });

  const checkForUpdate = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/app/version`);
      if (!response.ok) return;
      const data: VersionInfo = await response.json();

      setLatestVersion(data.latestVersion);
      setForceUpdate(data.forceUpdate);
      setReleaseNotes(data.releaseNotes || []);
      setReleaseDate(data.releaseDate || '');
      setUpdateUrl(data.updateUrl || '');

      const updateAvailable = compareVersions(data.latestVersion, CURRENT_APP_VERSION) > 0;
      const isBelowMinimum = data.minimumVersion && compareVersions(CURRENT_APP_VERSION, data.minimumVersion) < 0;
      const shouldForceUpdate = data.forceUpdate || isBelowMinimum;
      
      setHasUpdate(updateAvailable);
      if (shouldForceUpdate) {
        setForceUpdate(true);
      }

      const now = Date.now();
      setLastChecked(now);
      localStorage.setItem('app-update-last-checked', String(now));
      localStorage.setItem('app-update-release-notes', JSON.stringify(data.releaseNotes || []));
      localStorage.setItem('app-update-release-date', data.releaseDate || '');
      localStorage.setItem('app-update-minimum-version', data.minimumVersion || '');

      if (updateAvailable) {
        localStorage.setItem('app-update-available', 'true');
        localStorage.setItem('app-update-version', data.latestVersion);
        localStorage.setItem('app-update-force', String(shouldForceUpdate));
      } else {
        localStorage.removeItem('app-update-available');
        localStorage.removeItem('app-update-version');
        localStorage.removeItem('app-update-force');
      }
    } catch (error) {
      console.error('Failed to check for app update:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check on mount (throttled to once per 6 hours)
  useEffect(() => {
    const sixHours = 6 * 60 * 60 * 1000;
    if (!lastChecked || Date.now() - lastChecked > sixHours) {
      checkForUpdate();
    } else {
      const stored = localStorage.getItem('app-update-available');
      const storedVersion = localStorage.getItem('app-update-version');
      const storedForce = localStorage.getItem('app-update-force');
      const storedNotes = localStorage.getItem('app-update-release-notes');
      const storedDate = localStorage.getItem('app-update-release-date');
      if (storedNotes) {
        try { setReleaseNotes(JSON.parse(storedNotes)); } catch {}
      }
      if (storedDate) setReleaseDate(storedDate);
      if (stored === 'true' && storedVersion) {
        // Verify cached version is still newer than current app
        const stillHasUpdate = compareVersions(storedVersion, CURRENT_APP_VERSION) > 0;
        if (stillHasUpdate) {
          setLatestVersion(storedVersion);
          setHasUpdate(true);
          if (storedForce === 'true') {
            setForceUpdate(true);
          }
        } else {
          // Cached version is no longer newer, clear stale cache
          localStorage.removeItem('app-update-available');
          localStorage.removeItem('app-update-version');
          localStorage.removeItem('app-update-force');
          setHasUpdate(false);
          setForceUpdate(false);
        }
      }
    }
  }, []);

  // Check for updates when app comes to foreground (mobile)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppStateChange = (state: { isActive: boolean }) => {
      if (state.isActive) {
        const sixHours = 6 * 60 * 60 * 1000;
        const now = Date.now();
        if (!lastChecked || now - lastChecked > sixHours) {
          checkForUpdate();
        }
      }
    };

    // Capacitor App listeners
    const addListener = async () => {
      const { App } = await import('@capacitor/app');
      const listener = await App.addListener('appStateChange', handleAppStateChange);
      return listener;
    };

    addListener().then(listener => {
      return () => listener.remove();
    });
  }, [lastChecked, checkForUpdate]);

  const value: AppUpdateContextType = {
    currentVersion: CURRENT_APP_VERSION,
    latestVersion,
    hasUpdate,
    forceUpdate,
    releaseNotes,
    releaseDate,
    updateUrl,
    isChecking,
    lastChecked,
    checkForUpdate,
  };

  return (
    <AppUpdateContext.Provider value={value}>
      {children}
    </AppUpdateContext.Provider>
  );
};
