import { createContext, useContext, useEffect, ReactNode } from 'react';
import { translations, TranslationKey } from '@/i18n/translations';

interface LanguageContextType {
  language: 'ar';
  setLanguage: (lang: 'ar') => void;
  t: (key: TranslationKey) => string;
  dir: 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const language = 'ar';
  const dir = 'rtl';

  const setLanguage = () => {
    // Language is fixed to Arabic, no-op function for compatibility
  };

  const t = (key: TranslationKey): string => {
    return translations.ar[key] || key;
  };

  // Set initial direction
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
