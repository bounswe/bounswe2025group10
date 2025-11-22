import React, { createContext, useContext, useState, useEffect } from "react";

// Dynamically import all theme files from themes directory
const themeFiles = import.meta.glob("../themes/*.json", { eager: true });

// Convert to simple object with theme codes as keys
const themes = Object.keys(themeFiles).reduce((acc, path) => {
  const code = path.match(/\/([^/]+)\.json$/)?.[1];
  if (code) {
    const themeData = themeFiles[path].default || themeFiles[path];
    // Extract theme code without dashes (e.g., 'high-contrast' -> 'highContrast')
    const themeKey = code.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[themeKey] = { name: themeKey, ...themeData };
  }
  return acc;
}, {});

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get saved theme or default to 'light'
    return localStorage.getItem("theme") || "light";
  });

  const currentTheme = themes[theme] || themes.light;

  useEffect(() => {
    // Save theme preference
    localStorage.setItem("theme", theme);

    // Apply theme to document
    if (currentTheme) {
      document.body.style.backgroundColor = currentTheme.background;
      document.body.style.color = currentTheme.text;
    }

    // Add theme class to body
    document.body.className = currentTheme.class ? currentTheme.class : `theme-${theme}`;
  }, [theme, currentTheme]);

  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
    }
  };

  // Build availableThemes from dynamically loaded themes
  const availableThemes = Object.keys(themes).map((code) => ({
    code,
    name: themes[code].name || code,
    icon: themes[code].icon || "🎨",
  }));

  const value = {
    theme,
    changeTheme,
    currentTheme,
    availableThemes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
