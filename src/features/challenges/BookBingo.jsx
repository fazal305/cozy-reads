import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { useEntries } from '../../hooks/useEntries';
import { input, primaryButton, softButton } from '../../lib/ui';
import { BINGO_LINES, BINGO_PRESETS, FREE_INDEX, FREE_LABEL } from './bingoPresets';
import { BookList, ErrorNote, Modal } from './shared';
import { CURRENT_YEAR, bookRef, findBook, readBooks } from './challengeUtils';

function isFree(board, index) {
  return index === FREE_INDEX && board.prompts?.[FREE_INDEX] === FREE_LABEL;
}

function boardState(board, books) {
  const linked = Array.from({ length: 25 }, (_, i) => findBook(books, board.links?.[i]));
  const filled = linked.map((book, i) => Boolean(book) || isFree(board, i));
  const lines = BINGO_LINES.filter((line) => line.every((i) => filled[i]));
  const inLine = new Set(lines.flat());
  return { linked, filled, lines, inLine, blackout: filled.every(Boolean), count: filled.filter(Boolean).length };
}

function NewBoardForm({ onCreate, onCancel, canCancel }) {
  const [name, setName] = useState(`${CURRENT_YEAR} Reading Bingo`);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [preset, setPreset] = useState('classic');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await onCreate({ name: name.trim(), year: Number(year) || CURRENT_YEAR, preset });
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="p-4 rounded-2xl bg-cozy-bg border border-cozy-primary/60 space-y-3">
      <h3 className="font-serif text-lg text-cozy-text">New bingo board</h3>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr_2fr]">
        <label className="text-xs text-cozy-muted space-y-1">
          <span>Board name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="text-xs text-cozy-muted space-y-1">
          <span>Year</span>
          <input type="number" min="1900" max="2100" className={input} value={year} onChange={(e) => setYear(e.target.value)} />
        </label>
        <label className="text-xs text-cozy-muted space-y-1">
          <span>Prompts</span>
          <select className={input} value={preset} onChange={(e) => setPreset(e.target.value)}>
            {BINGO_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !name.trim()} className={primaryButton}>Create board</button>
        {canCancel && <button type="button" onClick={onCancel} className={softButton}>Cancel</button>}
      </div>
    </form>
  );
}

function SquareDialog({ board, index, book, books, openEditor, onSave, onClose }) {
  const [prompt, setPrompt] = useState(board.prompts?.[index] || '');
  const promptChanged = prompt.trim() !== (board.prompts?.[index] || '');

  const savePrompt = () => onSave({ prompt: prompt.trim() });

  return (
    <Modal labelId="bingo-square-title" eyebrow={`Square ${index + 1} of 25`} title={board.prompts?.[index] || 'Untitled square'} onClose={onClose}>
      <div className="space-y-2">
        <label htmlFor="bingo-prompt" className="text-xs font-medium text-cozy-muted">Prompt</label>
        <div className="flex gap-2">
          <input id="bingo-prompt" className={input} value={prompt} maxLength={60} placeholder="e.g. Book with a map" onChange={(e) => setPrompt(e.target.value)} />
          <button type="button" className={softButton} disabled={!promptChanged} onClick={savePrompt}>Save</button>
        </div>
      </div>
      {book && (
        <div className="flex items-center gap-3 p-2 rounded-xl bg-cozy-bg border border-cozy-primary/60">
          <BookCover book={book} className="w-10 h-14 shrink-0" />
          <span className="min-w-0 flex-1 font-serif text-sm text-cozy-text truncate">{book.title}</span>
          <button type="button" className={softButton} onClick={() => onSave({ link: null }, true)}>Unlink</button>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs font-medium text-cozy-muted">{book ? 'Swap for another read book' : 'Link a read book'}</p>
        <BookList books={readBooks(books)} selectedId={book?.id} onPick={(b) => onSave({ link: bookRef(b), prompt: prompt.trim() }, true)} openEditor={openEditor} onClose={onClose} />
      </div>
    </Modal>
  );
}

export default function BookBingo({ books, openEditor }) {
  const { entries, loading, add, update, remove } = useEntries('challenges.bingo');
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [square, setSquare] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [error, setError] = useState('');

  const entry = entries.find((e) => e.id === selectedId) || entries[0];
  const board = entry?.data;

  const save = async (data) => {
    setError('');
    const result = await update(entry.id, { data });
    if (result.error) setError(result.error);
  };

  const create = async ({ name, year, preset }) => {
    setError('');
    const prompts = [...(BINGO_PRESETS.find((p) => p.key === preset) || BINGO_PRESETS[0]).prompts];
    const result = await add({ entry_date: `${year}-01-01`, data: { name, year, preset, prompts, links: {} } });
    if (result.error) {
      setError(result.error);
      return;
    }
    setSelectedId(result.data.id);
    setCreating(false);
  };

  const saveSquare = async ({ prompt, link }, close) => {
    const prompts = [...board.prompts];
    if (typeof prompt === 'string') prompts[square] = prompt;
    const links = { ...board.links };
    if (link !== undefined) {
      if (link) links[square] = link;
      else delete links[square];
    }
    await save({ ...board, prompts, links });
    if (close) setSquare(null);
  };

  const deleteBoard = async () => {
    if (!confirm(`Delete the board "${board.name}"?`)) return;
    const result = await remove(entry.id);
    if (result.error) setError(result.error);
    setSelectedId(null);
  };

  if (loading) return <p className="text-sm text-cozy-muted">Loading your boards…</p>;

  if (!entry || creating) {
    return (
      <div className="space-y-3">
        {!entry && <p className="text-sm text-cozy-muted">Start a bingo board and fill each square with a book you have read.</p>}
        <NewBoardForm onCreate={create} onCancel={() => setCreating(false)} canCancel={Boolean(entry)} />
        <ErrorNote message={error} />
      </div>
    );
  }

  const state = boardState(board, books);
  const status = state.blackout
    ? '🎉 Blackout! Every square is filled.'
    : state.lines.length
      ? `🎯 ${state.lines.length} bingo${state.lines.length === 1 ? '' : 's'}!`
      : `${state.count} of 25 squares filled`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="bingo-board" className="sr-only">Board</label>
        <select id="bingo-board" className={`${input} sm:w-auto sm:max-w-xs`} value={entry.id} onChange={(e) => setSelectedId(e.target.value)}>
          {entries.map((e) => (
            <option key={e.id} value={e.id}>{e.data?.name || 'Untitled board'} ({e.data?.year})</option>
          ))}
        </select>
        <button type="button" className={softButton} onClick={() => setCreating(true)}>+ New board</button>
        <button type="button" className={softButton} onClick={() => setRenaming(board.name)}>Rename</button>
        <button type="button" className={softButton} onClick={deleteBoard}>Delete</button>
      </div>

      {renaming !== null && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!renaming.trim()) return;
            await save({ ...board, name: renaming.trim() });
            setRenaming(null);
          }}
        >
          <input aria-label="Board name" className={input} value={renaming} onChange={(e) => setRenaming(e.target.value)} autoFocus />
          <button type="submit" className={primaryButton}>Save</button>
          <button type="button" className={softButton} onClick={() => setRenaming(null)}>Cancel</button>
        </form>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-serif text-lg text-cozy-text break-words min-w-0">{board.name}</h3>
        <p role="status" className={`text-sm font-medium ${state.lines.length ? 'text-cozy-accent' : 'text-cozy-muted'}`}>{status}</p>
      </div>

      <div
        className={`grid grid-cols-5 gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl border-2 transition ${
          state.blackout ? 'border-cozy-accent bg-cozy-accent/10' : 'border-cozy-primary/60 bg-cozy-bg'
        }`}
        role="group"
        aria-label={`${board.name} bingo board`}
      >
        {board.prompts.map((prompt, i) => {
          const book = state.linked[i];
          const free = isFree(board, i) && !book;
          const hot = state.inLine.has(i);
          const label = `Square ${i + 1}: ${prompt || 'empty prompt'}${book ? `, linked to ${book.title}` : free ? ', free square' : ', not filled'}${hot ? ', part of a bingo' : ''}`;
          return (
            <button
              key={i}
              type="button"
              aria-label={label}
              onClick={() => setSquare(i)}
              className={`relative aspect-square rounded-lg sm:rounded-xl overflow-hidden border text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cozy-accent ${
                hot ? 'border-cozy-accent ring-2 ring-cozy-accent/70' : 'border-cozy-primary/60 hover:border-cozy-accent'
              } ${free ? 'bg-cozy-accent/15' : 'bg-cozy-card'}`}
            >
              {book ? (
                <>
                  <span className="absolute inset-0">
                    <BookCover book={book} className="w-full h-full [&_span+span]:hidden" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] sm:text-[10px] leading-tight px-0.5 py-0.5 line-clamp-2">
                    {prompt}
                  </span>
                </>
              ) : (
                <span className={`absolute inset-0 flex items-center justify-center p-0.5 sm:p-1.5 text-[9px] sm:text-xs leading-tight break-words ${free ? 'font-semibold text-cozy-accent' : 'text-cozy-text'}`}>
                  {free ? '⭐ Free' : prompt || <span className="text-cozy-muted">+ prompt</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-cozy-muted">Tap a square to link a read book or edit its prompt. Completed rows, columns and diagonals light up.</p>
      <ErrorNote message={error} />

      {square !== null && (
        <SquareDialog
          key={square}
          board={board}
          index={square}
          book={state.linked[square]}
          books={books}
          openEditor={openEditor}
          onSave={saveSquare}
          onClose={() => setSquare(null)}
        />
      )}
    </div>
  );
}
