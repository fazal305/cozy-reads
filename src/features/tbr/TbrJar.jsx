import { useState, useRef, useEffect } from 'react';
import BookCover from '../../components/BookCover';
import { today } from '../../lib/bookMeta';
import { primaryButton, softButton } from '../../lib/ui';

const SLIP_COLORS = ['#F4B5B5', '#F9D9A8', '#BFD8C2', '#C9C3E6', '#F2C6DE', '#B9D7EA'];

export default function TbrJar({ tbr, booksApi, openEditor }) {
  const [shaking, setShaking] = useState(false);
  const [pickedId, setPickedId] = useState(null);
  const [error, setError] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const picked = tbr.find((b) => b.id === pickedId) || null;

  const shake = () => {
    if (!tbr.length || shaking) return;
    setError('');
    setShaking(true);
    setPickedId(null);
    timer.current = setTimeout(() => {
      const pool = tbr.length > 1 ? tbr.filter((b) => b.id !== pickedId) : tbr;
      setPickedId(pool[Math.floor(Math.random() * pool.length)].id);
      setShaking(false);
    }, 900);
  };

  const startReading = async () => {
    const { error: updateError } = await booksApi.updateBook(picked.id, { status: 'reading', start_date: today() });
    if (updateError) setError(updateError);
    else setPickedId(null);
  };

  return (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      <p className="text-sm text-cozy-muted max-w-sm">
        Can't decide what to read next? Give the jar a shake and let fate pick from your {tbr.length} TBR {tbr.length === 1 ? 'book' : 'books'}.
      </p>

      <button
        type="button"
        onClick={shake}
        disabled={!tbr.length || shaking}
        aria-label="Shake the TBR jar"
        className={`relative w-40 h-48 origin-bottom disabled:cursor-not-allowed ${shaking ? 'animate-jar-shake' : 'hover:scale-105 transition'}`}
      >
        <span className="absolute left-1/2 -translate-x-1/2 top-0 w-24 h-5 rounded-md bg-[#C99A6B] dark:bg-[#8A6544] border border-[#A87B50] shadow-sm" />
        <span className="absolute left-1/2 -translate-x-1/2 top-4 w-28 h-3 rounded-sm bg-cozy-primary/50" />
        <span className="absolute inset-x-2 top-6 bottom-0 rounded-[2.5rem] rounded-t-2xl border-4 border-cozy-primary/70 bg-cozy-paper/40 overflow-hidden">
          <span className="absolute inset-x-0 bottom-0 h-3/4 flex flex-wrap content-end justify-center gap-1 p-3">
            {Array.from({ length: Math.min(14, Math.max(tbr.length * 2, 4)) }, (_, i) => (
              <span
                key={i}
                className="w-6 h-3 rounded-sm shadow-sm"
                style={{ backgroundColor: SLIP_COLORS[i % SLIP_COLORS.length], transform: `rotate(${((i * 37) % 50) - 25}deg)` }}
              />
            ))}
          </span>
          <span className="absolute top-3 left-3 w-3 h-16 rounded-full bg-white/40" />
        </span>
        <span className="absolute left-1/2 -translate-x-1/2 top-[45%] px-2 py-0.5 rounded bg-cozy-card border border-cozy-primary font-serif text-xs text-cozy-text shadow-sm">
          TBR
        </span>
      </button>

      <button type="button" onClick={shake} disabled={!tbr.length || shaking} className={primaryButton}>
        {shaking ? 'Shaking…' : picked ? 'Pick again' : 'Shake the jar'}
      </button>

      {!tbr.length && <p className="text-xs text-cozy-muted italic">Add a few books to your TBR to fill the jar.</p>}

      {picked && !shaking && (
        <div className="w-full max-w-sm bg-cozy-bg border border-cozy-primary rounded-2xl p-4 flex gap-4 items-center text-left animate-bounce-in" role="status">
          <BookCover book={picked} className="w-16 h-24 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-cozy-accent font-semibold">The jar has spoken</p>
            <p className="font-serif text-base text-cozy-text leading-tight">{picked.title}</p>
            {picked.author && <p className="text-xs text-cozy-muted">{picked.author}</p>}
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={startReading} className={primaryButton}>Start reading</button>
              <button type="button" onClick={() => openEditor(picked)} className={softButton}>Details</button>
            </div>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-cozy-accent">{error}</p>}
    </div>
  );
}
