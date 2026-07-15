import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, LanguageCode } from './translations';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'swm_language';

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // Initialize from localStorage or default to 'pt'
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    return (saved && translations[saved]) ? saved : 'pt';
  });

  // Update localStorage when language changes
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  // Translation function
  const t = (key: string): string => {
    const dict = translations[language];
    // Fallback to Portuguese if key is missing in the selected language
    if (!dict[key] && language !== 'pt') {
      return translations['pt'][key] || key;
    }
    return dict[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
