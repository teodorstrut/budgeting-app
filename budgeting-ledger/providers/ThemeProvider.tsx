import React, { createContext, useContext, useState } from 'react';
import { Appearance } from 'react-native';
import type { Theme } from '../types/theme';
import { themes } from '../theme/styles';
import db from '../database/connection';

type AppColorScheme = 'light' | 'dark';

const getSystemColorScheme = (): AppColorScheme =>
  Appearance.getColorScheme() === 'light' ? 'light' : 'dark';

const getStoredColorScheme = (): AppColorScheme => {
  try {
    const result = db.getFirstSync('SELECT value FROM settings WHERE key = ?', ['theme']);
    return result?.value === 'light' ? 'light' : result?.value === 'dark' ? 'dark' : getSystemColorScheme();
  } catch {
    return getSystemColorScheme();
  }
};

const persistColorScheme = (scheme: AppColorScheme) => {
  try {
    db.runSync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['theme', scheme]
    );
  } catch (error) {
    console.warn('Failed to persist theme preference:', error);
  }
};

const ThemeContext = createContext<{
  theme: Theme;
  colorScheme: AppColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: AppColorScheme) => void;
} | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorSchemeState] = useState<AppColorScheme>(getStoredColorScheme);

  const theme = themes[colorScheme];

  const setColorScheme = (scheme: AppColorScheme) => {
    setColorSchemeState(scheme);
    persistColorScheme(scheme);
  };

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};