import { useState, useEffect, useRef } from 'react';
import { PALETTES } from '../lib/theme';

function Swatch({ colors, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-full border border-black/10 ${className}`}
      style={{ background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` }}
    />
  );
}

export default function ThemePicker({ theme, toggleTheme, palette, setPalette }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const isDark = theme === 'dark';
  const current = PALETTES.find((p) => p.id === palette) || PALETTES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
        className="w-9 h-9 rounded-full border border-cozy-primary bg-cozy-bg text-base flex items-center justify-center hover:border-cozy-accent transition"
      >
        <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
      </button>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Colour theme: ${current.label}`}
        title="Colour theme"
        className="w-9 h-9 rounded-full border border-cozy-primary bg-cozy-bg flex items-center justify-center hover:border-cozy-accent transition"
      >
        <Swatch colors={current.swatch} className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-60 bg-cozy-card border border-cozy-border rounded-2xl shadow-lg p-3 animate-fade-in">
          <p id="palette-label" className="text-xs font-medium text-cozy-text mb-2">Colour theme</p>
          <div role="radiogroup" aria-labelledby="palette-label" className="grid grid-cols-4 gap-2">
            {PALETTES.map((p) => {
              const active = p.id === palette;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPalette(p.id)}
                  className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] text-cozy-text hover:bg-cozy-bg transition"
                >
                  <Swatch
                    colors={p.swatch}
                    className={`w-8 h-8 ${active ? 'ring-2 ring-cozy-accent ring-offset-2 ring-offset-cozy-card' : ''}`}
                  />
                  <span className={active ? 'font-semibold' : ''}>{p.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-cozy-muted mt-2 leading-snug">Midnight and Blush are always dark.</p>
        </div>
      )}
    </div>
  );
}
