import { useState } from 'react';
import { STICKERS } from '../../data/stickers';
import { useEntries } from '../../hooks/useEntries';
import { input, pill, primaryButton, softButton } from '../../lib/ui';
import { DeleteButton, Empty, ErrorNote, Field, Heading, Panel } from './shared';
import { isHttpsUrl, plural, uid, useRunner } from './utils';

const NOTE_COLORS = [
  { key: 'rose', label: 'Rose', className: 'bg-rose-100 text-rose-950 dark:bg-rose-900/50 dark:text-rose-50' },
  { key: 'amber', label: 'Butter', className: 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-50' },
  { key: 'sage', label: 'Sage', className: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-50' },
  { key: 'sky', label: 'Sky', className: 'bg-sky-100 text-sky-950 dark:bg-sky-900/50 dark:text-sky-50' },
  { key: 'lilac', label: 'Lilac', className: 'bg-violet-100 text-violet-950 dark:bg-violet-900/50 dark:text-violet-50' },
];

const ADD_MODES = [
  { key: 'image', label: '🖼️ Image' },
  { key: 'sticker', label: '🌟 Sticker' },
  { key: 'note', label: '📝 Note' },
];

function BoardImage({ item }) {
  const [failed, setFailed] = useState(false);
  if (failed || !isHttpsUrl(item.url)) {
    return <p className="p-4 text-xs text-cozy-muted italic text-center">Image could not load</p>;
  }
  return (
    <figure>
      <img src={item.url} alt={item.caption || 'Mood board image'} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="w-full h-auto block" />
      {item.caption && <figcaption className="px-2 py-1.5 text-xs text-cozy-text break-words">{item.caption}</figcaption>}
    </figure>
  );
}

function BoardItem({ item, index, total, onMove, onRemove }) {
  const sticker = item.type === 'sticker' ? STICKERS.find((s) => s.id === item.sticker_id) : null;
  const color = NOTE_COLORS.find((c) => c.key === item.color) || NOTE_COLORS[0];
  const name = item.type === 'note' ? 'note' : item.type === 'sticker' ? `sticker ${sticker?.name || ''}`.trim() : 'image';

  return (
    <li className="group relative rounded-xl overflow-hidden border border-cozy-primary/60 bg-cozy-paper shadow-sm">
      {item.type === 'image' && <BoardImage item={item} />}
      {item.type === 'sticker' && (sticker ? (
        <img src={sticker.src} alt={sticker.name} loading="lazy" className="w-full h-auto p-3 block" />
      ) : (
        <p className="p-4 text-xs text-cozy-muted italic text-center">Sticker missing</p>
      ))}
      {item.type === 'note' && (
        <p className={`p-4 font-serif text-sm whitespace-pre-line break-words min-h-[5rem] ${color.className}`}>{item.text}</p>
      )}
      <div className="flex items-center justify-end gap-1 p-1.5 border-t border-cozy-primary/40 bg-cozy-card/90">
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${name} ${index + 1} earlier`} className={`${softButton} px-2 py-1`}>←</button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${name} ${index + 1} later`} className={`${softButton} px-2 py-1`}>→</button>
        <DeleteButton label={`Remove ${name} ${index + 1}`} onConfirm={onRemove} />
      </div>
    </li>
  );
}

function AddItem({ onAdd }) {
  const [mode, setMode] = useState('image');
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [text, setText] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0].key);
  const [category, setCategory] = useState('all');
  const [urlError, setUrlError] = useState('');
  const categories = ['all', ...new Set(STICKERS.map((s) => s.category))];

  const addImage = async (e) => {
    e.preventDefault();
    if (!isHttpsUrl(url.trim())) {
      setUrlError('Use a full image link that starts with https://');
      return;
    }
    setUrlError('');
    const result = await onAdd({ id: uid(), type: 'image', url: url.trim(), caption: caption.trim() });
    if (!result?.error) {
      setUrl('');
      setCaption('');
    }
  };

  const addNote = async (e) => {
    e.preventDefault();
    const result = await onAdd({ id: uid(), type: 'note', text: text.trim(), color });
    if (!result?.error) setText('');
  };

  return (
    <Panel className="space-y-3">
      <div className="flex gap-2 flex-wrap" role="group" aria-label="Add to board">
        {ADD_MODES.map((m) => (
          <button key={m.key} type="button" onClick={() => setMode(m.key)} aria-pressed={mode === m.key} className={pill(mode === m.key)}>{m.label}</button>
        ))}
      </div>

      {mode === 'image' && (
        <form onSubmit={addImage} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto] sm:items-end" noValidate>
          <Field label="Image link (https)" id="board-url">
            <input
              id="board-url"
              type="url"
              inputMode="url"
              className={input}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError('');
              }}
              placeholder="https://…"
              aria-invalid={!!urlError}
              aria-describedby={urlError ? 'board-url-error' : undefined}
            />
          </Field>
          <Field label="Caption" id="board-caption">
            <input id="board-caption" className={input} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Rainy window vibes" />
          </Field>
          <button type="submit" disabled={!url.trim()} className={primaryButton}>+ Image</button>
          {urlError && <p id="board-url-error" role="alert" className="text-xs text-cozy-accent sm:col-span-3">{urlError}</p>}
        </form>
      )}

      {mode === 'sticker' && (
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Sticker category">
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c} className={`${pill(category === c)} capitalize`}>{c}</button>
            ))}
          </div>
          <ul className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {STICKERS.filter((s) => category === 'all' || s.category === category).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onAdd({ id: uid(), type: 'sticker', sticker_id: s.id })}
                  className="w-full aspect-square rounded-xl bg-cozy-paper border border-cozy-primary/60 hover:border-cozy-accent p-1 transition"
                  aria-label={`Add sticker ${s.name}`}
                  title={s.name}
                >
                  <img src={s.src} alt="" className="w-full h-full object-contain" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode === 'note' && (
        <form onSubmit={addNote} className="space-y-2">
          <Field label="Note" id="board-note">
            <textarea id="board-note" rows={3} className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Candlelit library, enemies who share an umbrella…" />
          </Field>
          <div className="flex items-center gap-2 flex-wrap">
            <span id="board-color-label" className="text-xs font-medium text-cozy-text">Colour</span>
            <div role="radiogroup" aria-labelledby="board-color-label" className="flex gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={color === c.key}
                  aria-label={c.label}
                  onClick={() => setColor(c.key)}
                  className={`w-7 h-7 rounded-full border-2 ${c.className} ${color === c.key ? 'border-cozy-accent' : 'border-transparent'}`}
                />
              ))}
            </div>
            <button type="submit" disabled={!text.trim()} className={`${primaryButton} ml-auto`}>+ Note</button>
          </div>
        </form>
      )}
    </Panel>
  );
}

export default function BookBoard() {
  const boards = useEntries('extras.board');
  const { error, run } = useRunner();
  const [activeId, setActiveId] = useState(null);
  const [name, setName] = useState('');
  const active = boards.entries.find((b) => b.id === activeId) || boards.entries[0];
  const items = active?.data.items || [];

  const addBoard = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await run(boards.add({ data: { name: name.trim(), items: [] } }));
    if (!result?.error) {
      setName('');
      setActiveId(result.data.id);
    }
  };

  const saveItems = (next) => run(boards.update(active.id, { data: { ...active.data, items: next } }));
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    saveItems(next);
  };

  return (
    <div className="space-y-5">
      <Heading title="Book board" subtitle="Collect the vibes for a book, a season or a reading mood" />
      <ErrorNote error={error || boards.error} />

      <div className="flex gap-2 flex-wrap items-center">
        {boards.entries.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1 max-w-full" role="group" aria-label="Boards">
            {boards.entries.map((b) => (
              <button key={b.id} type="button" onClick={() => setActiveId(b.id)} aria-pressed={active?.id === b.id} className={pill(active?.id === b.id)}>
                {b.data.name}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={addBoard} className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <label htmlFor="board-name" className="sr-only">New board name</label>
          <input id="board-name" className={`${input} sm:w-48`} value={name} onChange={(e) => setName(e.target.value)} placeholder="New board" />
          <button type="submit" disabled={!name.trim()} className={`${softButton} shrink-0`}>+ Board</button>
        </form>
      </div>

      {boards.loading ? null : !active ? (
        <Empty>Make your first board to pin images, stickers and notes.</Empty>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-serif text-base text-cozy-text break-words min-w-0">{active.data.name} <span className="text-xs font-sans text-cozy-muted">{plural(items.length, 'pin')}</span></h4>
            <DeleteButton label={`Delete board ${active.data.name}`} onConfirm={() => run(boards.remove(active.id))} />
          </div>
          <AddItem onAdd={(item) => saveItems([...items, item])} />
          {items.length ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-start" aria-label={`${active.data.name} pins`}>
              {items.map((item, i) => (
                <BoardItem key={item.id} item={item} index={i} total={items.length} onMove={(delta) => move(i, delta)} onRemove={() => saveItems(items.filter((x) => x.id !== item.id))} />
              ))}
            </ul>
          ) : (
            <Empty>This board is empty. Add an image, sticker or note.</Empty>
          )}
        </>
      )}
    </div>
  );
}
