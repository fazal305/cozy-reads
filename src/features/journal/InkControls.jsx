import { useRef } from 'react';
import { pill } from '../../lib/ui';
import { DRAW_TOOLS } from './inkPrefs';

const toolInfo = (id) => DRAW_TOOLS.find((t) => t.id === id) || DRAW_TOOLS[0];

// Three quick pens. Tap to use; hold, right-click or Shift+click to save the current pen in that slot.
export function Favourites({ favourites, ink, active, onUse, onSave, compact = false }) {
  const timer = useRef(null);
  const held = useRef(false);
  const stop = () => clearTimeout(timer.current);
  return (
    <div role="group" aria-label="Favourite pens" className="flex items-center gap-1 shrink-0">
      {favourites.map((f, i) => {
        const t = toolInfo(f.tool);
        return (
          <button
            key={i}
            type="button"
            aria-pressed={active === i}
            aria-label={`Favourite pen ${i + 1}: ${t.label}`}
            title="Tap to use. Hold, right-click or Shift+click to save the current pen here."
            onPointerDown={() => {
              held.current = false;
              stop();
              timer.current = setTimeout(() => {
                held.current = true;
                onSave(i);
              }, 550);
            }}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            onContextMenu={(e) => {
              e.preventDefault();
              stop();
              if (!held.current) onSave(i);
              held.current = true;
            }}
            onClick={(e) => {
              if (held.current) {
                held.current = false;
                return;
              }
              if (e.shiftKey) onSave(i);
              else onUse(f);
            }}
            className={`relative ${compact ? 'w-8 h-8' : 'w-9 h-9'} shrink-0 rounded-full border-2 flex items-center justify-center bg-cozy-bg select-none [-webkit-touch-callout:none] ${
              active === i ? 'border-cozy-accent ring-2 ring-cozy-accent/30' : 'border-cozy-border'
            }`}
          >
            <span aria-hidden="true" className="rounded-full ring-1 ring-black/10" style={{ background: f.color || ink, width: 6 + f.size * 4, height: 6 + f.size * 4 }} />
            <span aria-hidden="true" className="absolute -bottom-1 -right-1 text-[11px] leading-none">{t.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

function Choice({ legend, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-xs font-medium text-cozy-text mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={pill(value === id)}>
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function InkSettings({ prefs, setPref, stylusOnly }) {
  return (
    <div className="space-y-4 text-sm text-cozy-text">
      <Choice
        legend="Drawing input"
        options={[['finger', '✋ Draw with finger'], ['stylus', '✒️ Stylus only']]}
        value={stylusOnly ? 'stylus' : 'finger'}
        onChange={(v) => setPref('input', v)}
      />
      <p className="text-xs text-cozy-muted -mt-2">With stylus only, fingers scroll and zoom and a resting palm will not draw. It turns on by itself the first time a pen touches the page.</p>
      <Choice legend="Shape snapping" options={[['on', 'On'], ['off', 'Off']]} value={prefs.snap ? 'on' : 'off'} onChange={(v) => setPref('snap', v === 'on')} />
      <p className="text-xs text-cozy-muted -mt-2">Hold the pen still for a moment at the end of a stroke to turn it into a clean line, arrow, circle, rectangle or triangle. Highlighter strokes straighten.</p>
      <Choice legend="Toolbar position" options={[['top', 'Top'], ['bottom', 'Bottom']]} value={prefs.toolbar} onChange={(v) => setPref('toolbar', v)} />
      <p className="text-xs text-cozy-muted -mt-2">Gestures: pinch to zoom, two fingers to move around, tap with two fingers to undo and with three to redo.</p>
    </div>
  );
}
