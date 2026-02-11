import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  language: string;
  darkMode: boolean;
  setLanguage: (lang: string) => void;
  setDarkMode: (enabled: boolean) => void;
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

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') || 'en';
    const savedDarkMode = localStorage.getItem('app-dark-mode') === 'true';

    setLanguageState(savedLanguage);
    setDarkModeState(savedDarkMode);

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


  const value: SettingsContextType = {
    language,
    darkMode,
    setLanguage,
    setDarkMode,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};