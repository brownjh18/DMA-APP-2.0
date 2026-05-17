import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AppearanceMode = 'dark' | 'light' | 'system';

interface SettingsContextType {
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
  isDarkMode: boolean;
  pushNotifications: boolean;
  setPushNotifications: (value: boolean) => void;
  clearCache: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [appearance, setAppearanceState] = useState<AppearanceMode>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pushNotifications, setPushNotificationsState] = useState(true);

  // Check if system prefers dark mode
  const getSystemPreference = (): boolean => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Calculate actual dark mode based on appearance setting
  const calculateDarkMode = (mode: AppearanceMode): boolean => {
    if (mode === 'system') {
      return getSystemPreference();
    }
    return mode === 'dark';
  };

  // Apply dark mode to the document
  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('ion-theme-dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('ion-theme-dark');
    }
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedAppearance = (localStorage.getItem('app-appearance') as AppearanceMode) || 'system';
    const savedNotifications = localStorage.getItem('app-push-notifications') !== 'false';

    setAppearanceState(savedAppearance);
    setPushNotificationsState(savedNotifications);

    // Calculate initial dark mode state
    const initialDarkMode = calculateDarkMode(savedAppearance);
    setIsDarkMode(initialDarkMode);
    applyDarkMode(initialDarkMode);
  }, []);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (appearance !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (appearance === 'system') {
        const newDarkMode = e.matches;
        setIsDarkMode(newDarkMode);
        applyDarkMode(newDarkMode);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [appearance]);

  const setAppearance = (mode: AppearanceMode) => {
    setAppearanceState(mode);
    localStorage.setItem('app-appearance', mode);
    
    const newDarkMode = calculateDarkMode(mode);
    setIsDarkMode(newDarkMode);
    applyDarkMode(newDarkMode);
  };

  const setPushNotifications = (value: boolean) => {
    setPushNotificationsState(value);
    localStorage.setItem('app-push-notifications', String(value));
  };

  const clearCache = async () => {
    // Clear all app-related localStorage items
    const keysToRemove = [
      'app-appearance',
      'app-push-notifications',
      'app-language',
      'recent-searches',
      'downloaded-sermons',
      'favorites',
      'notifications',
      'pushToken',
      'token',
      'user',
      'savedSermons',
      'savedPodcasts',
      'savedDevotions'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear IndexedDB (if any app data is stored there)
    try {
      if (typeof indexedDB !== 'undefined') {
        const dbNames = await indexedDB.databases();
        for (const db of dbNames) {
          if (db.name && (db.name.includes('capacitor') || db.name.includes('dma') || db.name.includes('dove'))) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch (error) {
      console.warn('Could not clear IndexedDB:', error);
    }
    
    // Clear Cache API (for cached assets)
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('dma') || cacheName.includes('dove') || cacheName.includes('workbox')) {
            await caches.delete(cacheName);
          }
        }
      }
    } catch (error) {
      console.warn('Could not clear Cache API:', error);
    }
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reload the page to reset app state
    window.location.reload();
  };

  const value: SettingsContextType = {
    appearance,
    setAppearance,
    isDarkMode,
    pushNotifications,
    setPushNotifications,
    clearCache,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
