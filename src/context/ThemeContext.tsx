import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Theme definitions ───────────────────────────────────────────────────────

export type ThemeId = "blue" | "green";

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  description: string;
  /** Preview swatch colors for the theme picker UI */
  swatches: string[];
}

export const THEME_REGISTRY: Record<ThemeId, ThemeConfig> = {
  blue: {
    id: "blue",
    label: "Classic Blue",
    description: "The default modern blue theme",
    swatches: ["#2563EB", "#3B82F6", "#60A5FA", "#1E40AF"],
  },
  green: {
    id: "green",
    label: "Forest Green",
    description: "Rich, natural green palette with gold accents",
    swatches: ["#103020", "#286038", "#88B878", "#C49850"],
  },
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "inventq_theme";

// ─── Provider ────────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === "blue" || stored === "green")) return stored;
    } catch {}
    return "blue";
  });

  const applyTheme = useCallback((t: ThemeId) => {
    document.documentElement.setAttribute("data-theme", t);
    // Sync <meta name="theme-color"> for PWA / mobile chrome
    const metaThemeColor = THEME_REGISTRY[t].swatches[0];
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) metaTag.setAttribute("content", metaThemeColor);
  }, []);

  // Apply on mount and on change
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeConfig: THEME_REGISTRY[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
