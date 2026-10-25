import { useState, useCallback } from 'react';
import { getInitialTheme, applyTheme, saveTheme } from '../lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
