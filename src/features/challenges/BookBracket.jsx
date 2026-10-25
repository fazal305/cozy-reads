import { useState } from 'react';
import BookCover from '../../components/BookCover';
import { useEntries } from '../../hooks/useEntries';
import { pill, primaryButton, softButton } from '../../lib/ui';
import { BookList, ErrorNote, Modal, YearSelect } from './shared';
import { CURRENT_YEAR, bookRef, byFinish, findBook, readInYear } from './challengeUtils';

const SIZES = [8, 16];

// Standard seeding: 1 v 8, 4 v 5, 2 v 7, 3 v 6, and so on.
function seedOrder(size) {
  let order = [0];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.flatMap((s) => [s, n - 1 - s]);
  }
  return order;
}

function roundName(round, total) {
  const fromEnd = total - round;
  if (fromEnd === 1) return 'Final';
  if (fromEnd === 2) return 'Semi-finals';
  if (fromEnd === 3) return 'Quarter-finals';
  return `Round of ${2 ** fromEnd}`;
}

function topRated(books, year, size) {
  return [...readInYear(books, year)]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || byFinish(a, b))
    .slice(0, size);
}

function buildBracket(data, books) {
  const size = data.size;
  const seedBooks = Array.from({ length: size }, (_, i) => findBook(books, data.seeds?.[i]));
  const order = seedOrder(size);
  const roundCount = Math.log2(size);
  const rounds = [];
  for (let r = 0; r < roundCount; r++) {
    const matches = [];
    const count = size / 2 ** (r + 1);
    for (let m = 0; m < count; m++) {
      const sides =
        r === 0
          ? [order[2 * m], order[2 * m + 1]].map((idx) => (seedBooks[idx] ? idx : 'empty'))
          : [rounds[r - 1][2 * m].winner, rounds[r - 1][2 * m + 1].winner];
      const [a, b] = sides;
      const pick = data.picks?.[`${r}-${m}`];
      let winner = 'pending';
      if (a === 'empty' && b === 'empty') winner = 'empty';
      else if (a === 'empty' && typeof b === 'number') winner = b;
      else if (b === 'empty' && typeof a === 'number') winner = a;
      else if (typeof a === 'number' && typeof b === 'number' && (pick === a || pick === b)) winner = pick;
      matches.push({ round: r, match: m, sides, winner, playable: typeof a === 'number' && typeof b === 'number' });
    }
    rounds.push(matches);
  }
  const final = rounds[roundCount - 1][0].winner;
  return { seedBooks, rounds, champion: typeof final === 'number' ? final : null };
}

function Contestant({ idx, seedBooks, match, roundLabel, onPick }) {
  if (idx === 'pending') {
    return <div className="h-11 flex items-center px-2 rounded-lg border border-dashed border-cozy-primary text-xs text-cozy-muted">Waiting…</div>;
  }
  if (idx === 'empty') {
    return <div className="h-11 flex items-center px-2 rounded-lg border border-dashed border-cozy-primary/50 text-xs text-cozy-muted">Bye</div>;
  }
  const book = seedBooks[idx];
  const won = match.winner === idx;
  const lost = typeof match.winner === 'number' && !won;
  return (
    <button
      type="button"
      disabled={!match.playable}
      onClick={() => onPick(match, idx)}
      aria-pressed={won}
      aria-label={`${match.playable ? 'Pick' : 'Advances:'} ${book.title}, seed ${idx + 1}, ${roundLabel} match ${match.match + 1}${won ? ', winner' : ''}`}
      className={`w-full h-11 flex items-center gap-2 px-1.5 rounded-lg border text-left transition disabled:cursor-default ${
        won ? 'border-cozy-accent bg-cozy-accent/15' : 'border-cozy-primary/60 bg-cozy-card enabled:hover:border-cozy-accent'
      } ${lost ? 'opacity-50' : ''}`}
    >
      <span className="text-[10px] font-semibold text-cozy-muted w-4 shrink-0 text-right">{idx + 1}</span>
      <BookCover book={book} className="w-6 h-9 shrink-0 rounded-md [&_span+span]:hidden" />
      <span className={`min-w-0 flex-1 text-xs truncate ${won ? 'font-semibold text-cozy-text' : 'text-cozy-text'}`}>{book.title}</span>
      {won && <span aria-hidden="true" className="text-xs shrink-0">✓</span>}
    </button>
  );
}

function MatchCard({ match, seedBooks, roundLabel, onPick }) {
  return (
    <div className="space-y-1 p-1.5 rounded-xl bg-cozy-bg border border-cozy-primary/40" role="group" aria-label={`${roundLabel} match ${match.match + 1}`}>
      {match.sides.map((idx, side) => (
        <Contestant key={side} idx={idx} seedBooks={seedBooks} match={match} roundLabel={roundLabel} onPick={onPick} />
      ))}
    </div>
  );
}

function SetupPanel({ books, year, onCreate }) {
  const [size, setSize] = useState(8);
  const available = readInYear(books, year).length;
  return (
    <div className="p-4 rounded-2xl bg-cozy-bg border border-cozy-primary/60 space-y-3">
      <h3 className="font-serif text-lg text-cozy-text">Start the {year} Book Battle</h3>
      <p className="text-sm text-cozy-muted">
        Pit your favourite reads of the year against each other until one is crowned champion. You have {available} read book{available === 1 ? '' : 's'} in {year}
        {available < size ? '; empty slots become byes.' : '.'}
      </p>
      <div className="flex gap-2" role="group" aria-label="Bracket size">
        {SIZES.map((n) => (
          <button key={n} type="button" aria-pressed={size === n} className={pill(size === n)} onClick={() => setSize(n)}>
            {n} books
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryButton} onClick={() => onCreate(size, true)}>Seed my top-rated reads</button>
        <button type="button" className={softButton} onClick={() => onCreate(size, false)}>Pick the books myself</button>
      </div>
    </div>
  );
}

export default function BookBracket({ books, openEditor }) {
  const { entries, add, update, remove } = useEntries('challenges.bracket');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [editingSeeds, setEditingSeeds] = useState(false);
  const [slot, setSlot] = useState(null);
  const [error, setError] = useState('');

  const entry = entries.find((e) => e.data?.year === year);

  const save = async (data) => {
    setError('');
    const result = await update(entry.id, { data });
    if (result.error) setError(result.error);
  };

  const create = async (size, auto) => {
    setError('');
    const seeds = Array.from({ length: size }, () => null);
    if (auto) topRated(books, year, size).forEach((b, i) => (seeds[i] = bookRef(b)));
    const result = await add({ entry_date: `${year}-12-31`, data: { year, size, seeds, picks: {} } });
    if (result.error) setError(result.error);
    else setEditingSeeds(!auto);
  };

  const reset = async () => {
    if (!confirm(`Start the ${year} bracket over?`)) return;
    const result = await remove(entry.id);
    if (result.error) setError(result.error);
    setEditingSeeds(false);
  };

  if (!entry) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <YearSelect id="bracket-year" value={year} onChange={setYear} books={books} />
        </div>
        <SetupPanel books={books} year={year} onCreate={create} />
        <ErrorNote message={error} />
      </div>
    );
  }

  const data = entry.data;
  const { seedBooks, rounds, champion } = buildBracket(data, books);

  const pick = (match, idx) => {
    const key = `${match.round}-${match.match}`;
    const previous = match.winner;
    const picks = { ...data.picks, [key]: idx };
    if (typeof previous === 'number' && previous !== idx) {
      for (let r = match.round + 1, m = match.match >> 1; r < rounds.length; r++, m >>= 1) {
        if (picks[`${r}-${m}`] === previous) delete picks[`${r}-${m}`];
      }
    }
    save({ ...data, picks });
  };

  const setSeed = async (book) => {
    const seeds = [...data.seeds];
    const existing = seeds.findIndex((s, i) => i !== slot && findBook(books, s)?.id === book?.id);
    if (book && existing !== -1) seeds[existing] = seeds[slot];
    seeds[slot] = bookRef(book);
    await save({ ...data, seeds, picks: {} });
    setSlot(null);
  };

  const champ = champion !== null ? seedBooks[champion] : null;
  const usedPool = readInYear(books, year).length ? readInYear(books, year) : readInYear(books, 'all');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <YearSelect id="bracket-year" value={year} onChange={setYear} books={books} />
        <button type="button" className={softButton} aria-pressed={editingSeeds} onClick={() => setEditingSeeds((v) => !v)}>
          {editingSeeds ? 'Done editing seeds' : 'Edit seeds'}
        </button>
        <button type="button" className={softButton} onClick={reset}>Start over</button>
      </div>

      {champ ? (
        <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-cozy-accent bg-cozy-accent/10 animate-bounce-in" role="status">
          <BookCover book={champ} className="w-14 h-20 shrink-0 [&_span+span]:hidden" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cozy-accent-ink">👑 {year} champion</p>
            <p className="font-serif text-lg text-cozy-text break-words">{champ.title}</p>
            {champ.author && <p className="text-xs text-cozy-muted">{champ.author}</p>}
          </div>
        </div>
      ) : (
        <p className="text-sm text-cozy-muted">Tap the book that wins each match-up. Winners move on until a champion is crowned.</p>
      )}

      {editingSeeds && (
        <ol className="grid sm:grid-cols-2 gap-2" aria-label="Seeds">
          {seedBooks.map((book, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setSlot(i)}
                aria-label={`Seed ${i + 1}: ${book ? book.title : 'empty'}. Change book`}
                className="w-full flex items-center gap-2 p-2 rounded-xl border border-cozy-primary/60 bg-cozy-bg hover:border-cozy-accent text-left transition"
              >
                <span className="text-xs font-semibold text-cozy-muted w-5 text-right">{i + 1}</span>
                {book ? <BookCover book={book} className="w-7 h-10 shrink-0 [&_span+span]:hidden" /> : <span className="w-7 h-10 shrink-0 rounded-md border border-dashed border-cozy-primary" />}
                <span className={`min-w-0 flex-1 text-sm truncate ${book ? 'text-cozy-text' : 'text-cozy-muted'}`}>{book ? book.title : 'Choose a book'}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="hidden md:block overflow-x-auto pb-2" aria-label="Bracket">
        <div className="flex gap-3">
          {rounds.map((matches, r) => (
            <div key={r} className="flex-1 min-w-[9.5rem] flex flex-col">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-cozy-muted mb-2">{roundName(r, rounds.length)}</h4>
              <div className="flex-1 flex flex-col justify-around gap-3">
                {matches.map((match) => (
                  <MatchCard key={match.match} match={match} seedBooks={seedBooks} roundLabel={roundName(r, rounds.length)} onPick={pick} />
                ))}
              </div>
            </div>
          ))}
          <div className="flex-1 min-w-[8rem] flex flex-col">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-cozy-muted mb-2">Champion</h4>
            <div className="flex-1 flex items-center">
              <div className={`w-full p-2 rounded-xl border-2 text-center ${champ ? 'border-cozy-accent bg-cozy-accent/10' : 'border-dashed border-cozy-primary'}`}>
                <span className="text-2xl" aria-hidden="true">👑</span>
                <p className="text-xs font-serif text-cozy-text break-words">{champ ? champ.title : 'To be crowned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {rounds.map((matches, r) => (
          <section key={r} className="space-y-2" aria-label={roundName(r, rounds.length)}>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-cozy-muted">{roundName(r, rounds.length)}</h4>
            <div className="grid gap-2">
              {matches.map((match) => (
                <MatchCard key={match.match} match={match} seedBooks={seedBooks} roundLabel={roundName(r, rounds.length)} onPick={pick} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <ErrorNote message={error} />

      {slot !== null && (
        <Modal labelId="seed-title" eyebrow={`${year} Book Battle`} title={`Seed ${slot + 1}`} onClose={() => setSlot(null)}>
          {seedBooks[slot] && (
            <button type="button" className={softButton} onClick={() => setSeed(null)}>Leave this slot empty (bye)</button>
          )}
          <BookList books={usedPool} selectedId={seedBooks[slot]?.id} onPick={setSeed} openEditor={openEditor} onClose={() => setSlot(null)} />
        </Modal>
      )}
    </div>
  );
}
