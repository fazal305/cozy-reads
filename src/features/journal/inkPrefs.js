import { useState, useCallback } from 'react';
import { PEN_TOOLS } from './ink';

const KEY = 'cozy-reads-ink';

export const DEFAULT_FAVOURITES = [
  { tool: 'fountain', color: null, size: 1 },
  { tool: 'ballpoint', color: '#355070', size: 0 },
  { tool: 'brush', color: '#b5524f', size: 1 },
];

// input: 'auto' switches to stylus only once a pen is seen; 'finger' and 'stylus' are manual choices.
const DEFAULTS = { input: 'auto', snap: true, toolbar: 'bottom', favourites: DEFAULT_FAVOURITES };

const validFavourite = (f) => f && PEN_TOOLS.includes(f.tool) && [0, 1, 2].includes(f.size) && (f.color === null || typeof f.color === 'string');

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || typeof saved !== 'object') return DEFAULTS;
    const prefs = { ...DEFAULTS, ...saved };
    if (!Array.isArray(prefs.favourites) || prefs.favourites.length !== 3 || !prefs.favourites.every(validFavourite)) prefs.favourites = DEFAULT_FAVOURITES;
    return prefs;
  } catch {
    return DEFAULTS;
  }
}

export function useInkPrefs() {
  const [prefs, setPrefs] = useState(read);
  const setPref = useCallback((key, value) => {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // storage blocked: settings last for this visit only
      }
      return next;
    });
  }, []);
  return [prefs, setPref];
}

export const DRAW_TOOLS = [
  { id: 'fountain', label: 'Fountain', icon: '✒️' },
  { id: 'ballpoint', label: 'Ballpoint', icon: '🖊️' },
  { id: 'brush', label: 'Brush', icon: '🖌️' },
  { id: 'pencil', label: 'Pencil', icon: '✏️' },
  { id: 'highlighter', label: 'Highlighter', icon: '🖍️' },
  { id: 'eraser', label: 'Eraser', icon: '🧽' },
  { id: 'lasso', label: 'Lasso', icon: '➰' },
];
