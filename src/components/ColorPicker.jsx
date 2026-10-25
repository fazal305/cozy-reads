import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { normHex, hexToHsv, hsvToHex } from '../lib/colorMath';

const RECENT_KEY = 'cozy-reads-colors-recent';
const FAVOURITE_KEY = 'cozy-reads-colors-favourites';
const RECENT_MAX = 8;
const FAVOURITE_MAX = 16;
const RADIUS = 6;
const HEX_W = Math.sqrt(3);
const SPAN_W = (RADIUS * 2 + 1) * HEX_W;
const SPAN_H = RADIUS * 3 + 2;
const GREYS = ['#ffffff', '#e8e8e8', '#cfcfcf', '#b3b3b3', '#949494', '#707070', '#4d4d4d', '#2b2b2b', '#000000'];
const RING_TONES = [
  [0.6, 0.88], [0.7, 0.78], [0.8, 0.68], [0.85, 0.58], [0.85, 0.48], [0.8, 0.36],
];

function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed.map(normHex).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // storage blocked: lists last for this visit only
  }
}

function hslHex(h, s, l) {
  const v = l + s * Math.min(l, 1 - l);
  return hsvToHex(h, v ? 2 * (1 - l / v) : 0, v);
}

const CELLS = (() => {
  const cells = [];
  for (let r = -RADIUS; r <= RADIUS; r++) {
    for (let q = -RADIUS; q <= RADIUS; q++) {
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
      if (ring > RADIUS) continue;
      const x = HEX_W * (q + r / 2);
      const y = 1.5 * r;
      const hue = (Math.atan2(y, x) * 180) / Math.PI + 360;
      const [s, l] = RING_TONES[ring - 1] || [0, 1];
      cells.push({ q, r, left: ((x + SPAN_W / 2) / SPAN_W) * 100, top: ((y + SPAN_H / 2) / SPAN_H) * 100, hex: ring ? hslHex(hue % 360, s, l) : '#ffffff' });
    }
  }
  return cells;
})();

function useStoredColors() {
  const [recent, setRecent] = useState(() => readList(RECENT_KEY));
  const [favourites, setFavourites] = useState(() => readList(FAVOURITE_KEY));
  const remember = (hex) => {
    const c = normHex(hex);
    if (!c) return;
    setRecent((list) => {
      const next = [c, ...list.filter((x) => x !== c)].slice(0, RECENT_MAX);
      writeList(RECENT_KEY, next);
      return next;
    });
  };
  const toggleFavourite = (hex) => {
    const c = normHex(hex);
    if (!c) return;
    setFavourites((list) => {
      const next = list.includes(c) ? list.filter((x) => x !== c) : [c, ...list].slice(0, FAVOURITE_MAX);
      writeList(FAVOURITE_KEY, next);
      return next;
    });
  };
  return { recent, favourites, remember, toggleFavourite };
}

function Swatch({ hex, active, onClick, label, className = '' }) {
  return (
    <button
      type="button"
      aria-label={`${label} ${hex}`}
      aria-pressed={active}
      title={hex}
      onClick={onClick}
      className={`w-7 h-7 shrink-0 rounded-full border-2 transition ${active ? 'border-cozy-accent scale-110' : 'border-cozy-border'} ${className}`}
      style={{ background: hex }}
    />
  );
}

function Honeycomb({ value, onPick }) {
  const current = normHex(value);
  const start = Math.max(0, CELLS.findIndex((c) => c.hex === current));
  const [focus, setFocus] = useState(start);
  const refs = useRef([]);

  const find = (q, r) => CELLS.findIndex((c) => c.q === q && c.r === r);
  const onKeyDown = (e, i) => {
    const { q, r } = CELLS[i];
    const moves = {
      ArrowLeft: [[q - 1, r]],
      ArrowRight: [[q + 1, r]],
      ArrowUp: [[q + 1, r - 1], [q, r - 1]],
      ArrowDown: [[q - 1, r + 1], [q, r + 1]],
    }[e.key];
    if (!moves) return;
    e.preventDefault();
    for (const [nq, nr] of moves) {
      const next = find(nq, nr);
      if (next >= 0) {
        setFocus(next);
        refs.current[next]?.focus();
        return;
      }
    }
  };

  return (
    <div role="group" aria-label="Colour honeycomb" className="relative w-full" style={{ aspectRatio: `${SPAN_W} / ${SPAN_H}` }}>
      {CELLS.map((c, i) => (
        <button
          key={`${c.q},${c.r}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          tabIndex={i === focus ? 0 : -1}
          aria-label={`Colour ${c.hex}`}
          aria-pressed={c.hex === current}
          title={c.hex}
          onClick={() => {
            setFocus(i);
            onPick(c.hex);
          }}
          onKeyDown={(e) => onKeyDown(e, i)}
          className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none group"
          style={{ left: `${c.left}%`, top: `${c.top}%`, width: `${(HEX_W / SPAN_W) * 100}%`, height: `${(2 / SPAN_H) * 100}%` }}
        >
          <span
            className="absolute inset-[6%] transition-transform group-hover:scale-110 group-focus-visible:scale-125 group-focus-visible:z-10"
            style={{ background: c.hex, clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
          />
          {c.hex === current && <span aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white ring-1 ring-black/60" />}
        </button>
      ))}
    </div>
  );
}

function SaturationField({ hsv, onChange, onCommit }) {
  const ref = useRef(null);
  const set = (e) => {
    const r = ref.current.getBoundingClientRect();
    onChange({ ...hsv, s: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), v: Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)) });
  };
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (!d) return;
    e.preventDefault();
    onChange({ ...hsv, s: Math.max(0, Math.min(1, hsv.s + d[0])), v: Math.max(0, Math.min(1, hsv.v + d[1])) });
  };
  return (
    <div
      ref={ref}
      role="group"
      tabIndex={0}
      aria-label="Saturation and brightness. Use the arrow keys."
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => e.buttons && set(e)}
      onPointerUp={onCommit}
      onKeyDown={onKeyDown}
      onKeyUp={(e) => e.key.startsWith('Arrow') && onCommit()}
      className="relative h-28 rounded-xl cursor-crosshair touch-none border border-cozy-border focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-accent"
      style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))` }}
    >
      <span aria-hidden="true" className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
    </div>
  );
}

const panelButton = 'px-3 py-1.5 rounded-xl text-xs font-medium border border-cozy-primary bg-cozy-bg text-cozy-text hover:border-cozy-accent';

function ColorPanel({ value, onChange, opacity, onOpacity }) {
  const { recent, favourites, remember, toggleFavourite } = useStoredColors();
  const hex = normHex(value) || '#000000';
  const [hsv, setHsv] = useState(() => hexToHsv(hex));
  const [seen, setSeen] = useState(hex);
  const [draft, setDraft] = useState(hex);
  const [custom, setCustom] = useState(false);

  if (hex !== seen) {
    setSeen(hex);
    setDraft(hex);
    if (hsvToHex(hsv.h, hsv.s, hsv.v) !== hex) {
      const n = hexToHsv(hex);
      setHsv({ h: n.s === 0 || n.v === 0 ? hsv.h : n.h, s: n.s, v: n.v });
    }
  }

  const pick = (next) => {
    const c = normHex(next);
    if (!c) return;
    onChange(c);
    remember(c);
  };
  const changeHsv = (next) => {
    setHsv(next);
    onChange(hsvToHex(next.h, next.s, next.v));
  };
  const faved = favourites.includes(hex);
  const eyedropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  return (
    <div className="space-y-3">
      <Honeycomb value={hex} onPick={pick} />
      <div role="group" aria-label="Greyscale" className="flex items-center justify-between gap-1">
        {GREYS.map((g) => <Swatch key={g} hex={g} label="Grey" active={g === hex} onClick={() => pick(g)} className="!w-6 !h-6" />)}
      </div>

      {onOpacity && (
        <label className="flex items-center gap-2 text-xs font-medium text-cozy-text">
          <span className="w-14 shrink-0">Opacity</span>
          <input type="range" min="10" max="100" value={Math.round((opacity ?? 1) * 100)} onChange={(e) => onOpacity(Number(e.target.value) / 100)} className="flex-1 min-w-0 accent-cozy-accent" />
          <span className="w-9 text-right tabular-nums text-cozy-muted">{Math.round((opacity ?? 1) * 100)}%</span>
        </label>
      )}

      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg border border-cozy-border shrink-0" style={{ background: hex }} aria-hidden="true" />
        <button type="button" aria-expanded={custom} onClick={() => setCustom((o) => !o)} className={panelButton}>
          {custom ? 'Hide custom' : 'Custom colour'}
        </button>
        <button type="button" aria-pressed={faved} onClick={() => toggleFavourite(hex)} className={panelButton}>
          {faved ? '★ Unpin' : '☆ Pin'}
        </button>
        {eyedropper && (
          <button
            type="button"
            aria-label="Pick a colour from the screen"
            title="Pick from screen"
            onClick={() => new window.EyeDropper().open().then((r) => pick(r.sRGBHex)).catch(() => {})}
            className="w-8 h-8 shrink-0 rounded-xl border border-cozy-primary bg-cozy-bg text-cozy-text hover:border-cozy-accent flex items-center justify-center text-sm"
          >
            💧
          </button>
        )}
      </div>

      {custom && (
        <div className="space-y-2">
          <SaturationField hsv={hsv} onChange={changeHsv} onCommit={() => remember(hsvToHex(hsv.h, hsv.s, hsv.v))} />
          <input
            type="range"
            min="0"
            max="360"
            aria-label="Hue"
            value={Math.round(hsv.h)}
            onChange={(e) => changeHsv({ ...hsv, h: Number(e.target.value) })}
            onPointerUp={() => remember(hex)}
            onKeyUp={() => remember(hex)}
            className="w-full h-3 rounded-full appearance-none cursor-pointer border border-cozy-border [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cozy-accent [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-cozy-accent"
            style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          />
          <label className="flex items-center gap-2 text-xs font-medium text-cozy-text">
            <span className="w-14 shrink-0">Hex</span>
            <input
              value={draft}
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!normHex(draft)}
              onChange={(e) => {
                setDraft(e.target.value);
                const c = normHex(e.target.value);
                if (c) onChange(c);
              }}
              onBlur={() => (normHex(draft) ? pick(draft) : setDraft(hex))}
              onKeyDown={(e) => e.key === 'Enter' && normHex(draft) && pick(draft)}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border border-cozy-primary/60 bg-cozy-paper text-cozy-text text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cozy-accent"
            />
          </label>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold text-cozy-muted mb-1">Recent</p>
        {recent.length ? (
          <div role="group" aria-label="Recent colours" className="flex flex-wrap gap-1.5">
            {recent.map((c) => <Swatch key={c} hex={c} label="Recent colour" active={c === hex} onClick={() => pick(c)} className="!w-6 !h-6" />)}
          </div>
        ) : (
          <p className="text-[11px] text-cozy-muted">Colours you use will show up here.</p>
        )}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-cozy-muted mb-1">Favourites</p>
        {favourites.length ? (
          <div role="group" aria-label="Favourite colours" className="flex flex-wrap gap-1.5">
            {favourites.map((c) => (
              <span key={c} className="relative inline-flex">
                <Swatch hex={c} label="Favourite colour" active={c === hex} onClick={() => pick(c)} className="!w-6 !h-6" />
                <button
                  type="button"
                  aria-label={`Remove favourite ${c}`}
                  onClick={() => toggleFavourite(c)}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cozy-card border border-cozy-border text-[8px] leading-none text-cozy-text flex items-center justify-center"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-cozy-muted">Tap Pin to keep the current colour here.</p>
        )}
      </div>
    </div>
  );
}

// Bottom sheet on phones, a card next to the trigger on larger screens.
function Popover({ anchor, label, onClose, children }) {
  const panelRef = useRef(null);
  const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches;
  let pos = null;
  if (wide && anchor) {
    const r = anchor.getBoundingClientRect();
    const width = 308;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 8));
    pos = r.top > window.innerHeight / 2
      ? { left, width, bottom: window.innerHeight - r.top + 8, maxHeight: r.top - 16 }
      : { left, width, top: r.bottom + 8, maxHeight: window.innerHeight - r.bottom - 16 };
  }

  useEffect(() => {
    panelRef.current?.querySelector('button[tabindex="0"]')?.focus();
    return () => anchor?.focus?.();
  }, [anchor]);

  const onKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[80]" onPointerDown={(e) => e.stopPropagation()}>
      <div className={`absolute inset-0 ${wide ? '' : 'bg-black/40'}`} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={`absolute bg-cozy-card border border-cozy-border shadow-2xl p-4 overflow-y-auto overscroll-contain font-sans ${
          wide ? 'rounded-2xl' : 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]'
        }`}
        style={pos || undefined}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-serif text-base text-cozy-text">{label}</h3>
          <button type="button" onClick={onClose} aria-label="Close colour picker" className="w-8 h-8 rounded-full border border-cozy-primary bg-cozy-bg text-cozy-text hover:text-cozy-accent-ink flex items-center justify-center text-sm">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

// Preset dots plus a rainbow dot that opens the full picker.
export function ColorSwatches({ colors, value, onChange, label, opacity, onOpacity }) {
  const [anchor, setAnchor] = useState(null);
  const current = normHex(value);
  const preset = colors.some((c) => normHex(c) === current);
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1.5 shrink-0">
      {colors.map((c) => (
        <Swatch key={c} hex={c} label={label} active={normHex(c) === current} onClick={() => onChange(c)} />
      ))}
      <button
        type="button"
        aria-label={`${label}: more colours`}
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        title="More colours"
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        className={`relative w-7 h-7 shrink-0 rounded-full border-2 transition ${!preset ? 'border-cozy-accent scale-110' : 'border-cozy-border'}`}
        style={{ background: 'conic-gradient(#f66, #fd5, #6d8, #5cf, #a7f, #f6b, #f66)' }}
      >
        <span aria-hidden="true" className="absolute inset-[5px] rounded-full border border-white/80" style={{ background: current || '#ffffff' }} />
      </button>
      {anchor && (
        <Popover anchor={anchor} label={label} onClose={() => setAnchor(null)}>
          <ColorPanel value={value} onChange={onChange} opacity={opacity} onOpacity={onOpacity} />
        </Popover>
      )}
    </div>
  );
}

export default ColorPanel;
