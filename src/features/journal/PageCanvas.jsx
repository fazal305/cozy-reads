import { useState, useId, forwardRef, memo } from 'react';
import { STICKERS } from '../../data/stickers';
import PageBackground from './PageBackground';
import { WashiSvg, ShapeSvg } from './decor';
import { strokeGeometry, strokeStyle, grainTile, GRAIN_TILE } from './ink';
import { PAGE_W, PAGE_H } from './templates';
import ElementBody from './ElementBody';
import { imageValue, boxStyle, textStyle, pageLayers } from './layout';
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

// Strokes never change once saved, so each path only re-renders when its item is replaced.
const StrokePath = memo(function StrokePath({ stroke, paint }) {
  const { d, filled } = strokeGeometry(stroke);
  const st = strokeStyle(stroke);
  return filled ? (
    <path d={d} fill={paint || stroke.color} opacity={st.opacity} />
  ) : (
    <path d={d} fill="none" stroke={stroke.color} strokeWidth={st.width} strokeLinecap={st.cap} strokeLinejoin="round" opacity={st.opacity} />
  );
});

// Pencil grain: each pencil colour gets a small tile with the grain mask applied once, and the tile is repeated.
function StrokeGroup({ strokes }) {
  const id = useId().replace(/:/g, '');
  const colours = [...new Set(strokes.filter((s) => s.tool === 'pencil').map((s) => s.color))];
  return (
    <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none">
      {colours.length > 0 && (
        <defs>
          <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width={GRAIN_TILE} height={GRAIN_TILE}>
            <image href={grainTile().url} width={GRAIN_TILE} height={GRAIN_TILE} />
          </mask>
          {colours.map((c, i) => (
            <pattern key={c} id={`${id}p${i}`} patternUnits="userSpaceOnUse" width={GRAIN_TILE} height={GRAIN_TILE}>
              <rect width={GRAIN_TILE} height={GRAIN_TILE} fill={c} mask={`url(#${id}m)`} />
            </pattern>
          ))}
        </defs>
      )}
      {strokes.map((s) => (
        <StrokePath key={s.id} stroke={s} paint={s.tool === 'pencil' ? `url(#${id}p${colours.indexOf(s.color)})` : null} />
      ))}
    </svg>
  );
}

export function ItemBody({ item, editing, active, onTextChange, onTextBlur, onItemChange }) {
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
  if (item.type === 'element') return <ElementBody item={item} active={active} onChange={onItemChange ? (patch, gid) => onItemChange(item.id, patch, gid) : undefined} />;
  if (item.type === 'text') return <TextBox item={item} editing={editing} onTextChange={onTextChange} onTextBlur={onTextBlur} />;
  return null;
}

// Renders a page. Without handlers it is a read-only view (used for thumbnails).
const PageCanvas = forwardRef(function PageCanvas(
  { page, bgRef, interactive = false, editingId, selectedId, onItemPointerDown, onItemDoubleClick, onTextChange, onTextBlur, onItemChange, className = '', style, children, ...rest },
  ref,
) {
  const layers = pageLayers(page.items || []);

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}`, containerType: 'inline-size', ...style }}
      {...rest}
    >
      <PageBackground ref={bgRef} template={page.template} paper={page.paper} paperColor={page.paperColor} />
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
            <ItemBody item={layer.item} editing={editingId === layer.item.id} active={interactive && selectedId === layer.item.id} onTextChange={onTextChange} onTextBlur={onTextBlur} onItemChange={interactive ? onItemChange : undefined} />
          </div>
        ),
      )}
      {children}
    </div>
  );
});

export default PageCanvas;
