import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '../services/api';

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
      setHasUpdate(updateAvailable);

      const now = Date.now();
      setLastChecked(now);
      localStorage.setItem('app-update-last-checked', String(now));
      localStorage.setItem('app-update-release-notes', JSON.stringify(data.releaseNotes || []));
      localStorage.setItem('app-update-release-date', data.releaseDate || '');

      if (updateAvailable) {
        localStorage.setItem('app-update-available', 'true');
        localStorage.setItem('app-update-version', data.latestVersion);
      } else {
        localStorage.removeItem('app-update-available');
        localStorage.removeItem('app-update-version');
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
        } else {
          // Cached version is no longer newer, clear stale cache
          localStorage.removeItem('app-update-available');
          localStorage.removeItem('app-update-version');
          setHasUpdate(false);
        }
      }
    }
  }, []);

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
