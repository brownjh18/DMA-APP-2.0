import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  language: string;
  darkMode: boolean;
  notificationsEnabled: boolean;
  setLanguage: (lang: string) => void;
  setDarkMode: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  showNotification: (title: string, body: string) => void;
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
  const [language, setLanguageState] = useState('en');
  const [darkMode, setDarkModeState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') || 'en';
    const savedDarkMode = localStorage.getItem('app-dark-mode') === 'true';
    const savedNotifications = localStorage.getItem('app-notifications') !== 'false';

    setLanguageState(savedLanguage);
    setDarkModeState(savedDarkMode);
    setNotificationsEnabledState(savedNotifications);

    // Apply dark mode
    applyDarkMode(savedDarkMode);
  }, []);

  const applyDarkMode = (isDark: boolean) => {
    // Ionic React uses ion-theme-dark class for dark mode
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('ion-theme-dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('ion-theme-dark');
    }
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    // Here you would typically trigger a language change in your i18n system
  };

  const setDarkMode = (enabled: boolean) => {
    setDarkModeState(enabled);
    localStorage.setItem('app-dark-mode', enabled.toString());
    applyDarkMode(enabled);
  };

  const setNotificationsEnabled = async (enabled: boolean) => {
    if (enabled) {
      // Request notification permission if enabling
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission denied');
          setNotificationsEnabledState(false);
          localStorage.setItem('app-notifications', 'false');
          return;
        }
      }
    }
    setNotificationsEnabledState(enabled);
    localStorage.setItem('app-notifications', enabled.toString());
  };

  const showNotification = (title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png', // You can add an icon
        badge: '/icon-192x192.png'
      });
    }
  };

  const value: SettingsContextType = {
    language,
    darkMode,
    notificationsEnabled,
    setLanguage,
    setDarkMode,
    setNotificationsEnabled,
    showNotification,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};