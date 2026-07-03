import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('ui-theme') as Theme;
    return savedTheme || 'system';
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists() && snap.data().theme) {
          setThemeState(snap.data().theme as Theme);
          localStorage.setItem('ui-theme', snap.data().theme);
        }
      });
    }
  }, [user]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('ui-theme', newTheme);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
      } catch (e) {
        // user doc might not exist yet, setDoc instead
        await setDoc(doc(db, 'users', user.uid), { theme: newTheme }, { merge: true });
      }
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
