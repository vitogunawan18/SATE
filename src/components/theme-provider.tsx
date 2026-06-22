'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark'); // default to dark
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const isPrintingRef = useRef(false);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme setting', e);
    }
  };

  useEffect(() => {
    // Read from localStorage on mount
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    } catch (e) {
      console.error('Failed to load theme setting', e);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      // Skip theme modification if currently printing or in print media to avoid breaking system theme UI
      const isPrintMode = isPrintingRef.current || window.matchMedia('print').matches;
      if (isPrintMode) return;

      let activeTheme: 'light' | 'dark' = 'light';
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        activeTheme = systemTheme;
      } else {
        activeTheme = theme;
      }

      setResolvedTheme(activeTheme);

      if (activeTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    const handleBeforePrint = () => {
      isPrintingRef.current = true;
    };

    const handleAfterPrint = () => {
      isPrintingRef.current = false;
      applyTheme();
    };

    applyTheme();

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    let mediaQuery: MediaQueryList | null = null;
    let listener: (() => void) | null = null;

    if (theme === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
    }

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (mediaQuery && listener) {
        mediaQuery.removeEventListener('change', listener);
      }
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
