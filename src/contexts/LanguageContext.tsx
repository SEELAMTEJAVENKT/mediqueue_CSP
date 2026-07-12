import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Language } from '../types';
import { getBrowserLanguage, t as translate } from '../utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred-language') as Language;
    return saved || getBrowserLanguage();
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : language === 'te' ? 'te' : 'en';
  }, [language]);

  const t = useCallback((key: string) => translate(key, language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
