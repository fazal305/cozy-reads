import { useState, forwardRef } from 'react';
import { STICKERS } from '../../data/stickers';
import PageBackground from './PageBackground';
import { WashiSvg, ShapeSvg } from './decor';
import { strokeGeometry, strokeStyle } from './ink';
import { PAGE_W, PAGE_H } from './templates';
import { imageValue, boxStyle, textStyle } from './layout';
import { useCoverSrc } from '../../lib/coverUrls';

function PageImage({ item }) {
  const value = imageValue(item);
  const src = useCoverSrc(value);
  const [failedSrc, setFailedSrc] = useState(null);
  if (!value || (src && failedSrc === src)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/5 border border-dashed border-black/20 text-[10px] text-center text-black/50 p-1">
        Image could not load
      </div>
    );
  }
  if (!src) return <div role="img" aria-label="Loading photo" className="w-full h-full bg-black/10 animate-pulse" />;
  return <img src={src} alt="" draggable={false} referrerPolicy="no-referrer" onError={() => setFailedSrc(src)} className="w-full h-full object-cover block select-none" />;
}

function TextBox({ item, editing, onTextChange, onTextBlur }) {
  if (!editing) return item.text || '​';
  return (
    <div className="relative">
      <div aria-hidden="true" className="invisible">{`${item.text}​`}</div>
      <textarea
        autoFocus
        aria-label="Text box"
        value={item.text}
        onChange={(e) => onTextChange(item.id, e.target.value)}
        onBlur={() => onTextBlur(item.id)}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
        onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
        className="absolute inset-0 w-full h-full resize-none overflow-hidden bg-transparent border-0 p-0 m-0 focus:outline-none"
        style={{ font: 'inherit', color: 'inherit', lineHeight: 'inherit', letterSpacing: 'inherit', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      />
    </div>
  );
}

function StrokeGroup({ strokes }) {
  return (
    <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none">
      {strokes.map((s) => {
        const { d, filled } = strokeGeometry(s);
        const st = strokeStyle(s);
        return filled ? (
          <path key={s.id} d={d} fill={s.color} opacity={st.opacity} />
        ) : (
          <path key={s.id} d={d} fill="none" stroke={s.color} strokeWidth={st.width} strokeLinecap={st.cap} strokeLinejoin="round" opacity={st.opacity} />
        );
      })}
    </svg>
  );
}

export function ItemBody({ item, editing, onTextChange, onTextBlur }) {
  if (item.type === 'sticker') {
    const sticker = STICKERS.find((s) => s.id === item.sticker);
    return sticker ? (
      <img src={sticker.src} alt={sticker.name} draggable={false} className="w-full h-full object-contain block select-none" />
    ) : (
      <div className="w-full h-full rounded bg-black/5" />
    );
  }
  if (item.type === 'image') return <PageImage item={item} />;
  if (item.type === 'washi') return <WashiSvg item={item} exportId={item.id} />;
  if (item.type === 'shape') return <ShapeSvg item={item} exportId={item.id} />;
  if (item.type === 'text') return <TextBox item={item} editing={editing} onTextChange={onTextChange} onTextBlur={onTextBlur} />;
  return null;
}

// Renders a page. Without handlers it is a read-only view (used for thumbnails).
const PageCanvas = forwardRef(function PageCanvas(
  { page, bgRef, interactive = false, editingId, onItemPointerDown, onItemDoubleClick, onTextChange, onTextBlur, className = '', style, children, ...rest },
  ref,
) {
  const items = page.items || [];
  const layers = [];
  let group = null;
  for (const item of items) {
    if (item.type === 'stroke') {
      if (!group) {
        group = [];
        layers.push({ key: `ink-${item.id}`, strokes: group });
      }
      group.push(item);
    } else {
      group = null;
      layers.push({ key: item.id, item });
    }
  }

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}`, containerType: 'inline-size', ...style }}
      {...rest}
    >
      <PageBackground ref={bgRef} template={page.template} paper={page.paper} />
      {layers.map((layer) =>
        layer.strokes ? (
          <StrokeGroup key={layer.key} strokes={layer.strokes} />
        ) : (
          <div
            key={layer.key}
            data-item={layer.item.id}
            className={`absolute ${interactive ? 'cursor-move touch-none' : 'pointer-events-none'}`}
            style={{ ...boxStyle(layer.item), ...(layer.item.type === 'text' ? textStyle(layer.item) : null) }}
            onPointerDown={interactive ? (e) => onItemPointerDown(e, layer.item) : undefined}
            onDoubleClick={interactive && onItemDoubleClick ? () => onItemDoubleClick(layer.item) : undefined}
          >
            <ItemBody item={layer.item} editing={editingId === layer.item.id} onTextChange={onTextChange} onTextBlur={onTextBlur} />
          </div>
        ),
      )}
      {children}
    </div>
  );
});

export default PageCanvas;
