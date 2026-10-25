import { useState, useCallback } from 'react';
import { getInitialTheme, getInitialPalette, applyTheme, saveTheme, savePalette, isDarkOnly } from '../lib/theme';

export function useTheme() {
  const [state, setState] = useState(() => ({ theme: getInitialTheme(), palette: getInitialPalette() }));
  const isDark = state.theme === 'dark' || isDarkOnly(state.palette);

  const update = useCallback((next) => {
    applyTheme(next.theme, next.palette);
    saveTheme(next.theme);
    savePalette(next.palette);
    setState(next);
  }, []);

  // Leaving a dark-only palette for light mode falls back to the default palette.
  const toggleTheme = useCallback(() => {
    if (isDark) update({ theme: 'light', palette: isDarkOnly(state.palette) ? 'rose' : state.palette });
    else update({ theme: 'dark', palette: state.palette });
  }, [isDark, state.palette, update]);

  const setPalette = useCallback((palette) => update({ theme: state.theme, palette }), [state.theme, update]);

  return { theme: isDark ? 'dark' : 'light', toggleTheme, palette: state.palette, setPalette };
}
