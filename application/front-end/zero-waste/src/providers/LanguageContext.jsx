import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Dynamically import all language files from i18n directory
const translations = import.meta.glob("../i18n/*.json", { eager: true });

// Convert to simple object with language codes as keys
const languages = Object.keys(translations).reduce((acc, path) => {
  const code = path.match(/\/([^/]+)\.json$/)?.[1];
  if (code) acc[code] = translations[path].default || translations[path];
  return acc;
}, {});

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  const current = languages[language] || languages.en;
  const isRTL = current?.direction === "rtl";

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = useCallback((key) => {
    if (!key) return "";
    const value = key.split(".").reduce((obj, k) => obj?.[k], current);
    return value || key.split(".").reduce((obj, k) => obj?.[k], languages.en) || key;
  }, [current]);

  const changeLanguage = (code) => languages[code] && setLanguage(code);

  const availableLanguages = Object.keys(languages).map((code) => ({
    code,
    name: languages[code]?.name || code,
    flag: languages[code]?.flag || "",
  }));

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isRTL, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};
