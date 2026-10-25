import { useState } from 'react';
import { STICKERS, STICKER_CATEGORIES } from '../../data/stickers';
import { pill } from '../../lib/ui';
import { WashiSvg, ShapeSvg } from './decor';
import { DECOR_COLORS, WASHI_STYLES, SHAPES } from './templates';
import { decorItem } from './items';
import { ELEMENTS } from './elements';
import ElementBody from './ElementBody';

const TABS = [
  { id: 'stickers', label: 'Stickers' },
  { id: 'tape', label: 'Tape' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'elements', label: 'Elements' },
];

function categoryLabel(id) {
  return STICKER_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export function DecorPreview({ payload }) {
  if (payload.kind === 'sticker') {
    const sticker = STICKERS.find((s) => s.id === payload.sticker);
    return sticker ? <img src={sticker.src} alt="" draggable={false} className="w-full h-full object-contain" /> : null;
  }
  const item = decorItem(payload.kind === 'element' ? { ...payload, color: 'rgb(var(--cozy-text))' } : payload, 0.5, 0.5);
  if (payload.kind === 'element') {
    const ratio = item.h / item.w;
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full" style={{ aspectRatio: `${1 / (ratio * 1414 / 1000)}` }}>
          <ElementBody item={item} />
        </div>
      </div>
    );
  }
  const ratio = (item.h * 1414) / (item.w * 1000);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ width: ratio > 1 ? `${100 / ratio}%` : '100%', aspectRatio: `${1 / ratio}` }}>
        {payload.kind === 'washi' ? <WashiSvg item={item} /> : <ShapeSvg item={item} />}
      </div>
    </div>
  );
}

export default function StickerDrawer({ onPick, onDragStart, onClose, ink }) {
  const [tab, setTab] = useState('stickers');
  const [category, setCategory] = useState('all');
  const [color, setColor] = useState(DECOR_COLORS[0]);
  const categories = ['all', ...STICKER_CATEGORIES.map((c) => c.id).filter((id) => STICKERS.some((s) => s.category === id))];

  let options;
  if (tab === 'stickers') {
    options = STICKERS.filter((s) => category === 'all' || s.category === category).map((s) => ({ key: s.id, label: s.name, payload: { kind: 'sticker', sticker: s.id } }));
  } else if (tab === 'tape') {
    options = WASHI_STYLES.map((w) => ({ key: w.id, label: w.label, payload: { kind: 'washi', style: w.id, color } }));
  } else if (tab === 'elements') {
    options = ELEMENTS.map((el) => ({ key: el.id, label: el.label, payload: { kind: 'element', element: el.id, color: ink } }));
  } else {
    options = SHAPES.map((s) => ({ key: s.id, label: s.label, payload: { kind: 'shape', shape: s.id, color } }));
  }

  const pick = (e, payload) => {
    if (payload.kind === 'sticker') {
      const img = e.currentTarget.querySelector('img');
      payload = { ...payload, aspect: img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 1 };
    }
    return payload;
  };

  return (
    <aside
      aria-label="Stickers and decorations"
      className="fixed inset-x-0 bottom-0 z-[60] max-h-[55vh] flex flex-col rounded-t-3xl border-t border-cozy-border bg-cozy-card shadow-2xl sm:static sm:z-auto sm:max-h-none sm:w-72 sm:shrink-0 sm:rounded-none sm:border-t-0 sm:border-l sm:shadow-none"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h2 className="font-serif text-base text-cozy-text">Add to page</h2>
        <button type="button" onClick={onClose} aria-label="Close drawer" className="w-8 h-8 rounded-full border border-cozy-primary bg-cozy-bg text-cozy-text hover:text-cozy-accent-ink flex items-center justify-center text-sm">
          ✕
        </button>
      </div>
      <div role="tablist" aria-label="Decoration type" className="flex shrink-0 gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={pill(tab === t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'stickers' ? (
        <div className="flex shrink-0 gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide" aria-label="Sticker category">
          {categories.map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={`${pill(category === c)} !py-1`}>
              {c === 'all' ? 'All' : categoryLabel(c)}
            </button>
          ))}
        </div>
      ) : tab === 'elements' ? null : (
        <div className="flex shrink-0 gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide" aria-label="Colour">
          {DECOR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 shrink-0 rounded-full border-2 ${color === c ? 'border-cozy-accent scale-110' : 'border-cozy-border'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      )}
      <p className="shrink-0 px-4 pb-1 text-[11px] text-cozy-muted">Drag onto the page, or tap to add it in the middle.</p>
      <ul className={`grid ${tab === 'elements' ? 'grid-cols-3 sm:grid-cols-2' : 'grid-cols-4 sm:grid-cols-3'} gap-2 px-4 pb-4 pt-1 overflow-y-auto overscroll-contain`}>
        {options.map((o) => (
          <li key={o.key}>
            <button
              type="button"
              title={o.label}
              aria-label={`Add ${o.label}`}
              onPointerDown={(e) => onDragStart(e, pick(e, o.payload))}
              onClick={(e) => onPick(pick(e, o.payload))}
              className="w-full aspect-square rounded-xl border border-cozy-primary/60 bg-cozy-bg hover:border-cozy-accent p-1.5 transition"
            >
              <DecorPreview payload={o.payload} />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
