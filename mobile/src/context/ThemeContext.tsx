import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Colors, DarkColors } from '../constants/theme';

export type ColorPalette = typeof Colors;

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  C: ColorPalette;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  C: Colors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('theme_preference')
      .then(v => { if (v === 'dark') setIsDark(true); })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      SecureStore.setItemAsync('theme_preference', next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, C: isDark ? DarkColors : Colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
