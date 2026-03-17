import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { en } from "./translations/en";
import { sw } from "./translations/sw";
import { es } from "./translations/es";
import { fr } from "./translations/fr";
import { de } from "./translations/de";
import { so } from "./translations/so";

export type Language = "en" | "sw" | "es" | "fr" | "de" | "so";

export const languageNames: Record<Language, string> = {
  en: "English",
  sw: "Kiswahili",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  so: "Soomaali",
};

const translations: Record<Language, Record<string, string>> = { en, sw, es, fr, de, so };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("kaasmart-lang");
    return (saved as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("kaasmart-lang", lang);
  }, []);

  const t = useCallback(
    (key: string) => translations[language]?.[key] || translations.en[key] || key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
