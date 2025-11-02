import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export type ThemePalette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  border: string;
};

const LIGHT: ThemePalette = {
  background: '#ecfdf5',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  text: '#0f172a',
  textMuted: '#6b7280',
  primary: '#16a34a',
  accent: '#0369a1',
  border: '#e5e7eb',
};

const DARK: ThemePalette = {
  background: '#0b1320',
  surface: '#111827',
  surfaceMuted: '#1f2937',
  text: '#e5e7eb',
  textMuted: '#94a3b8',
  primary: '#22c55e',
  accent: '#60a5fa',
  border: '#1f2937',
};

function paletteFor(mode: ThemeMode): ThemePalette {
  return mode === 'dark' ? DARK : LIGHT;
}

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  palette: ThemePalette;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@adams_eden_theme_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = React.useState<ThemeMode>('light');

  React.useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') setThemeState(saved);
      } catch {}
    })();
  }, []);

  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    (async () => { try { await AsyncStorage.setItem(STORAGE_KEY, mode); } catch {} })();
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme, palette: paletteFor(theme) }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
