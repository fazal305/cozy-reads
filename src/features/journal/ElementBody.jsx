import { useRef, useEffect } from 'react';
import { fontCss } from './templates';
import { CHECK, RATING, MOOD, MOODS, TABLE, QUOTE, STAR_D, CHILI_D, quoteSize, withHeight } from './elements';

const u = (n) => `${n}cqw`;
const field = 'bg-transparent border-0 p-0 m-0 min-w-0 focus:outline-none placeholder:opacity-40';

// `onChange(patch, gid)` makes the element editable; without it the element is read-only.
// The outer box is the size container that every cqw inside measures against.
export default function ElementBody(props) {
  return (
    <div style={{ width: '100%', height: '100%', containerType: 'inline-size' }}>
      <Body {...props} />
    </div>
  );
}

function Body({ item, active, onChange }) {
  const edit = !!onChange;
  // A tap on a field of an unselected element selects and drags it; once selected the field takes the tap.
  const own = (e) => active && e.stopPropagation();
  const typed = `type-${item.id}`;
  const rootStyle = { width: '100%', height: '100%', color: item.color, fontFamily: fontCss(item.font), lineHeight: 1.25 };

  if (item.kind === 'checklist') {
    return <Checklist item={item} edit={edit} own={own} onChange={onChange} typed={typed} style={rootStyle} />;
  }

  if (item.kind === 'stars' || item.kind === 'spice') {
    const spice = item.kind === 'spice';
    return (
      <div role="group" aria-label={spice ? 'Spice rating' : 'Star rating'} className="flex items-center" style={{ ...rootStyle, padding: `0 ${u(RATING.edge)}` }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= (item.value || 0);
          const icon = (
            <svg viewBox="0 0 1 1" width={u(RATING.icon)} height={u(RATING.icon)} className="block overflow-visible" aria-hidden="true">
              <path
                d={spice ? CHILI_D : STAR_D}
                fill={on ? item.color : 'none'}
                fillOpacity={spice ? 0.9 : 1}
                stroke={item.color}
                strokeOpacity={on ? 1 : 0.4}
                strokeWidth={spice ? 0.06 : 0.07}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          );
          return edit ? (
            <button
              key={n}
              type="button"
              aria-label={`${n} ${spice ? (n === 1 ? 'chili' : 'chilies') : n === 1 ? 'star' : 'stars'}`}
              aria-pressed={on}
              onClick={() => onChange({ value: item.value === n ? n - 1 : n })}
              className="flex items-center justify-center"
              style={{ width: u(RATING.slot), height: u(RATING.height) }}
            >
              {icon}
            </button>
          ) : (
            <span key={n} className="flex items-center justify-center" style={{ width: u(RATING.slot), height: u(RATING.height) }}>
              {icon}
            </span>
          );
        })}
      </div>
    );
  }

  if (item.kind === 'mood') {
    return (
      <div role="group" aria-label="Mood" className="flex items-center justify-around" style={rootStyle}>
        {MOODS.map((m, i) => {
          const chosen = item.value === i;
          const face = (
            <span
              aria-hidden="true"
              className="flex items-center justify-center rounded-full leading-none"
              style={{
                width: u(MOOD.emoji * 1.5),
                height: u(MOOD.emoji * 1.5),
                fontSize: u(MOOD.emoji),
                fontFamily: 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                opacity: chosen || item.value == null ? 1 : 0.4,
                background: chosen ? `${item.color}2e` : 'transparent',
                boxShadow: chosen ? `inset 0 0 0 ${u(0.5)} ${item.color}` : 'none',
              }}
            >
              {m.emoji}
            </span>
          );
          return edit ? (
            <button key={m.label} type="button" aria-label={m.label} aria-pressed={chosen} onClick={() => onChange({ value: chosen ? null : i })}>
              {face}
            </button>
          ) : (
            <span key={m.label}>{face}</span>
          );
        })}
      </div>
    );
  }

  if (item.kind === 'table') {
    return (
      <div className="grid" style={{ ...rootStyle, gridTemplateColumns: `repeat(${item.cols}, 1fr)`, gridTemplateRows: `repeat(${item.rows}, ${u(TABLE.row)})`, fontSize: u(TABLE.text), boxShadow: `inset 0 0 0 ${u(0.5)} ${item.color}` }}>
        {item.cells.flatMap((row, r) =>
          row.map((text, c) => (
            <div key={`${r}-${c}`} className="min-w-0 overflow-hidden flex items-center" style={{ padding: `0 ${u(TABLE.pad)}`, boxShadow: `inset ${c ? u(0.5) : '0'} ${r ? u(0.5) : '0'} 0 0 ${item.color}` }}>
              {edit ? (
                <input
                  aria-label={`Row ${r + 1}, column ${c + 1}`}
                  value={text}
                  onChange={(e) => onChange({ cells: item.cells.map((cells, ri) => (ri === r ? cells.map((v, ci) => (ci === c ? e.target.value : v)) : cells)) }, typed)}
                  onPointerDown={own}
                  className={`${field} w-full`}
                  style={{ font: 'inherit', color: 'inherit' }}
                />
              ) : (
                <span className="truncate">{text}</span>
              )}
            </div>
          )),
        )}
      </div>
    );
  }

  // quote
  const size = quoteSize(item.quote);
  return (
    <div className="relative" style={{ ...rootStyle, borderRadius: u(3), boxShadow: `inset 0 0 0 ${u(0.7)} ${item.color}` }}>
      <span aria-hidden="true" className="absolute leading-none" style={{ left: u(QUOTE.pad - 1), top: u(-1), fontSize: u(22), opacity: 0.35, fontFamily: fontCss('serif') }}>“</span>
      <div className="absolute overflow-hidden" style={{ left: u(QUOTE.pad + 2), right: u(QUOTE.pad), top: u(QUOTE.textTop), height: u(QUOTE.textHeight), fontSize: u(size) }}>
        {edit ? (
          <textarea
            aria-label="Quote"
            placeholder="Favourite line…"
            value={item.quote}
            onChange={(e) => onChange({ quote: e.target.value }, typed)}
            onPointerDown={own}
            className={`${field} w-full h-full resize-none overflow-hidden`}
            style={{ font: 'inherit', color: 'inherit', lineHeight: 'inherit' }}
          />
        ) : (
          <p className="whitespace-pre-wrap break-words">{item.quote}</p>
        )}
      </div>
      <div className="absolute" style={{ left: u(QUOTE.pad), right: u(QUOTE.pad), top: u(QUOTE.byTop), fontSize: u(QUOTE.by), textAlign: 'right' }}>
        {edit ? (
          <input
            aria-label="Who said it"
            placeholder="Who said it?"
            value={item.by}
            onChange={(e) => onChange({ by: e.target.value }, typed)}
            onPointerDown={own}
            className={`${field} w-full text-right`}
            style={{ font: 'inherit', color: 'inherit' }}
          />
        ) : (
          item.by && <span className="truncate block">{`— ${item.by}`}</span>
        )}
      </div>
    </div>
  );
}

function Checklist({ item, edit, own, onChange, typed, style }) {
  const root = useRef(null);
  const focusRow = useRef(null);

  useEffect(() => {
    if (focusRow.current == null) return;
    root.current?.querySelector(`[data-row="${focusRow.current}"]`)?.focus();
    focusRow.current = null;
  });

  const setItems = (items, gid) => onChange(withHeight(item, { items }), gid);
  const setRow = (i, patch, gid) => setItems(item.items.map((row, ri) => (ri === i ? { ...row, ...patch } : row)), gid);

  const onKeyDown = (e, i) => {
    if (e.key === 'Enter' && item.items.length < CHECK.maxRows) {
      e.preventDefault();
      focusRow.current = i + 1;
      setItems([...item.items.slice(0, i + 1), { t: '', done: false }, ...item.items.slice(i + 1)]);
    } else if (e.key === 'Backspace' && !item.items[i].t && item.items.length > 1) {
      e.preventDefault();
      focusRow.current = Math.max(0, i - 1);
      setItems(item.items.filter((_, ri) => ri !== i));
    }
  };

  return (
    <div ref={root} style={{ ...style, padding: `${u(CHECK.pad)} ${u(CHECK.pad)}`, fontSize: u(CHECK.text) }}>
      {item.items.map((row, i) => {
        const box = (
          <svg viewBox="0 0 10 10" width={u(CHECK.box)} height={u(CHECK.box)} className="block overflow-visible" aria-hidden="true">
            <rect x="0.5" y="0.5" width="9" height="9" rx="2.2" fill={row.done ? item.color : 'none'} stroke={item.color} strokeWidth="1.1" />
            {row.done && <path d="M2.6 5.2 L4.4 7 L7.5 3.2" fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
        );
        const textStyle = { font: 'inherit', color: 'inherit', textDecoration: row.done ? 'line-through' : 'none', opacity: row.done ? 0.6 : 1 };
        return (
          <div key={i} className="flex items-center" style={{ height: u(CHECK.row), gap: u(CHECK.left - CHECK.pad - CHECK.box) }}>
            {edit ? (
              <button type="button" role="checkbox" aria-checked={row.done} aria-label={`Item ${i + 1}`} onClick={() => setRow(i, { done: !row.done })} className="shrink-0 flex">
                {box}
              </button>
            ) : (
              <span className="shrink-0 flex">{box}</span>
            )}
            {edit ? (
              <input
                data-row={i}
                aria-label={`Checklist item ${i + 1}`}
                placeholder="Add item"
                value={row.t}
                onChange={(e) => setRow(i, { t: e.target.value }, typed)}
                onKeyDown={(e) => onKeyDown(e, i)}
                onPointerDown={own}
                className={`${field} flex-1`}
                style={textStyle}
              />
            ) : (
              <span className="flex-1 min-w-0 truncate" style={textStyle}>{row.t}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
