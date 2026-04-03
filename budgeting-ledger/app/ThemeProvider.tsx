import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { Theme, themes } from './styles';

const ThemeContext = createContext<{
  theme: Theme;
  colorScheme: ColorSchemeName;
  toggleTheme: () => void;
} | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });
    return () => subscription?.remove();
  }, []);

  const theme = themes[colorScheme === 'dark' ? 'dark' : 'light'];

  const toggleTheme = () => {
    // For manual toggle, but since we follow system, perhaps not needed, but for settings
    // For now, just log or something
    console.log('Toggle theme');
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};