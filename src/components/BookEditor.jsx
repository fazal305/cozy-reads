import { useState, useEffect, useRef } from 'react';
import BookCover from './BookCover';
import RatingInput from './RatingInput';
import { TROPES } from '../data/tropes';
import { STATUSES, FORMATS, SEASONS, MOODS, GENRES, SPINE_SWATCHES, SPINE_STYLES, spineStyle } from '../lib/bookMeta';
import { input, pill, primaryButton, softButton } from '../lib/ui';

const STAR = <span className="text-amber-400">★</span>;
const STAR_EMPTY = <span className="text-amber-400">☆</span>;

function toForm(book) {
  return {
    title: book.title || '',
    author: book.author || '',
    cover_url: book.cover_url || '',
    status: book.status || 'read',
    format: book.format || '',
    genre: book.genre || '',
    pages: book.pages ?? '',
    start_date: book.start_date || '',
    finish_date: book.finish_date || '',
    rating: book.rating ?? null,
    spice: book.spice ?? 0,
    mood: book.mood || '',
    tropes: Array.isArray(book.tropes) ? book.tropes : [],
    series_name: book.series_name || '',
    series_number: book.series_number ?? '',
    season: book.season || '',
    summary: book.summary || '',
    review: book.review || '',
    review_done: Boolean(book.review_done),
    favorite: Boolean(book.favorite),
    quotes: Array.isArray(book.quotes) ? book.quotes : [],
    dnf_reason: book.dnf_reason || '',
    dnf_progress: book.dnf_progress || '',
    extra: book.extra && typeof book.extra === 'object' ? book.extra : {},
  };
}

function toRow(form) {
  const text = (v) => v.trim();
  const orNull = (v) => (String(v).trim() === '' ? null : String(v).trim());
  const extra = { ...form.extra };
  Object.keys(extra).forEach((k) => {
    if (extra[k] === '' || extra[k] === null || extra[k] === undefined) delete extra[k];
  });
  if (extra.price !== undefined) extra.price = Number(extra.price);

  return {
    title: text(form.title),
    author: text(form.author),
    cover_url: text(form.cover_url),
    status: form.status,
    format: form.format || null,
    genre: orNull(form.genre),
    pages: form.pages === '' ? null : Math.max(1, parseInt(form.pages, 10) || 1),
    start_date: form.start_date || null,
    finish_date: form.finish_date || null,
    rating: form.rating || null,
    spice: form.spice || 0,
    mood: form.mood || null,
    tropes: form.tropes,
    series_name: orNull(form.series_name),
    series_number: form.series_number === '' ? null : Number(form.series_number),
    season: form.season || null,
    summary: text(form.summary),
    review: text(form.review),
    review_done: form.review_done,
    favorite: form.favorite,
    quotes: form.quotes.map((q) => q.trim()).filter(Boolean),
    dnf_reason: orNull(form.dnf_reason),
    dnf_progress: orNull(form.dnf_progress),
    extra,
  };
}

function Field({ label, htmlFor, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-cozy-text">
        {label}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="space-y-3 pt-4 border-t border-cozy-border">
      <legend className="font-serif text-base text-cozy-text font-semibold pr-2">{title}</legend>
      {children}
    </fieldset>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-xs font-medium text-cozy-text"
    >
      <span className={`w-9 h-5 rounded-full p-0.5 transition ${checked ? 'bg-cozy-accent' : 'bg-cozy-primary/60'}`}>
        <span className={`block w-4 h-4 rounded-full bg-white shadow transition ${checked ? 'translate-x-4' : ''}`} />
      </span>
      {label}
    </button>
  );
}

// book: an existing row to edit, or null to add one. defaults: starting fields for a new book.
export default function BookEditor({ book, defaults, booksApi, onClose }) {
  const isNew = !book;
  const [form, setForm] = useState(() => toForm(book || defaults || {}));
  const [mode, setMode] = useState('full');
  const [coverFile, setCoverFile] = useState(null);
  const [newQuote, setNewQuote] = useState('');
  const [customTrope, setCustomTrope] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      clearTimeout(savedTimer.current);
    };
  }, [onClose]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setExtra = (key, value) => setForm((f) => ({ ...f, extra: { ...f.extra, [key]: value } }));

  const toggleTrope = (trope) =>
    set('tropes', form.tropes.includes(trope) ? form.tropes.filter((t) => t !== trope) : [...form.tropes, trope]);

  const addCustomTrope = () => {
    const t = customTrope.trim();
    if (t && !form.tropes.includes(t)) set('tropes', [...form.tropes, t]);
    setCustomTrope('');
  };

  const addQuote = () => {
    if (!newQuote.trim()) return;
    set('quotes', [...form.quotes, newQuote.trim()]);
    setNewQuote('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Every book needs a title.');
      return;
    }
    setSaving(true);
    setError('');

    const row = toRow(form);
    if (coverFile) {
      const { data: url, error: uploadError } = await booksApi.uploadCover(coverFile);
      if (uploadError) {
        setError(uploadError);
        setSaving(false);
        return;
      }
      if (url) row.cover_url = url;
    }

    const result = isNew ? await booksApi.addBook(row) : await booksApi.updateBook(book.id, row);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (isNew) {
      onClose();
      return;
    }
    setCoverFile(null);
    set('cover_url', row.cover_url);
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm(`Remove "${book.title}" from your journal?`)) return;
    const { error: deleteError } = await booksApi.deleteBook(book.id);
    if (deleteError) setError(deleteError);
    else onClose();
  };

  const preview = { ...form, cover_url: coverFile ? '' : form.cover_url };
  const mini = mode === 'mini';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        noValidate
        className="bg-cozy-card border border-cozy-border rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-xl p-5 sm:p-8 space-y-5 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cozy-accent-ink">
              {isNew ? 'New book' : 'Reading journal'}
            </span>
            <h3 id="editor-title" className="font-serif text-2xl text-cozy-text leading-tight">
              {isNew ? 'Add a book' : form.title || 'Untitled'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-cozy-bg p-1 border border-cozy-primary" role="group" aria-label="Review mode">
              {['full', 'mini'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                    mode === m ? 'bg-cozy-accent-strong text-white shadow-sm' : 'text-cozy-muted hover:text-cozy-text'
                  }`}
                >
                  {m === 'full' ? 'Full' : 'Mini'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 shrink-0 rounded-full bg-cozy-bg border border-cozy-primary text-cozy-text hover:bg-cozy-accent-strong hover:text-white flex items-center justify-center text-sm transition"
              aria-label="Close editor"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <BookCover book={preview} className="w-20 h-28 sm:w-24 sm:h-36 shrink-0" />
          <div className="flex-1 min-w-0 space-y-3">
            <Field label="Title *" htmlFor="ed-title">
              <input id="ed-title" className={input} value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus={isNew} required />
            </Field>
            <Field label="Author" htmlFor="ed-author">
              <input id="ed-author" className={input} value={form.author} onChange={(e) => set('author', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-cozy-text">Star rating</p>
          <RatingInput label="Star rating" value={form.rating} onChange={(v) => set('rating', v)} icon={STAR} emptyIcon={STAR_EMPTY} />
        </div>

        {mini ? (
          <>
            <Field label="Thoughts" htmlFor="ed-review-mini">
              <textarea id="ed-review-mini" rows={4} className={`${input} resize-y`} value={form.review} onChange={(e) => set('review', e.target.value)} placeholder="A few words on how it made you feel…" />
            </Field>
            <Field label="Favourite quote" htmlFor="ed-quote-mini">
              <textarea
                id="ed-quote-mini"
                rows={2}
                className={`${input} resize-none font-serif italic`}
                value={form.quotes[0] || ''}
                onChange={(e) => set('quotes', [e.target.value, ...form.quotes.slice(1)])}
                placeholder="The line you keep thinking about…"
              />
            </Field>
          </>
        ) : (
          <>
            <Section title="Details">
              <div>
                <p className="text-xs font-medium text-cozy-text mb-1.5">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s.key} type="button" onClick={() => set('status', s.key)} aria-pressed={form.status === s.key} className={pill(form.status === s.key)}>
                      <span aria-hidden="true">{s.emoji}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Format" htmlFor="ed-format">
                  <select id="ed-format" className={input} value={form.format} onChange={(e) => set('format', e.target.value)}>
                    <option value="">Not set</option>
                    {FORMATS.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Genre" htmlFor="ed-genre">
                  <input id="ed-genre" list="ed-genres" className={input} value={form.genre} onChange={(e) => set('genre', e.target.value)} />
                  <datalist id="ed-genres">
                    {GENRES.map((g) => <option key={g} value={g} />)}
                  </datalist>
                </Field>
                <Field label="Pages" htmlFor="ed-pages">
                  <input id="ed-pages" type="number" min="1" inputMode="numeric" className={input} value={form.pages} onChange={(e) => set('pages', e.target.value)} />
                </Field>
                <Field label="Started" htmlFor="ed-start">
                  <input id="ed-start" type="date" className={input} value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
                </Field>
                <Field label="Finished" htmlFor="ed-finish">
                  <input id="ed-finish" type="date" className={input} value={form.finish_date} onChange={(e) => set('finish_date', e.target.value)} />
                </Field>
                <Field label="Season TBR" htmlFor="ed-season">
                  <select id="ed-season" className={input} value={form.season} onChange={(e) => set('season', e.target.value)}>
                    <option value="">None</option>
                    {SEASONS.map((s) => (
                      <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Series" htmlFor="ed-series" className="col-span-2">
                  <input id="ed-series" className={input} value={form.series_name} onChange={(e) => set('series_name', e.target.value)} placeholder="e.g. The Empyrean" />
                </Field>
                <Field label="Book #" htmlFor="ed-series-no">
                  <input id="ed-series-no" type="number" min="0" step="0.5" className={input} value={form.series_number} onChange={(e) => set('series_number', e.target.value)} />
                </Field>
              </div>

              {form.status === 'tbr' && (
                <Field label="Hopeful for month" htmlFor="ed-month">
                  <input id="ed-month" type="month" className={input} value={form.extra.month || ''} onChange={(e) => setExtra('month', e.target.value)} />
                </Field>
              )}
              {form.status === 'wishlist' && (
                <Field label="Price" htmlFor="ed-price">
                  <input id="ed-price" type="number" min="0" step="0.01" className={input} value={form.extra.price ?? ''} onChange={(e) => setExtra('price', e.target.value)} />
                </Field>
              )}
              {form.format === 'arc' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="ARC publisher" htmlFor="ed-arc-pub">
                    <input id="ed-arc-pub" className={input} value={form.extra.arc_publisher || ''} onChange={(e) => setExtra('arc_publisher', e.target.value)} />
                  </Field>
                  <Field label="Review due" htmlFor="ed-arc-due">
                    <input id="ed-arc-due" type="date" className={input} value={form.extra.arc_due || ''} onChange={(e) => setExtra('arc_due', e.target.value)} />
                  </Field>
                </div>
              )}
              {form.status === 'dnf' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Stopped at" htmlFor="ed-dnf-progress">
                    <input id="ed-dnf-progress" className={input} value={form.dnf_progress} onChange={(e) => set('dnf_progress', e.target.value)} placeholder="e.g. page 120 or 40%" />
                  </Field>
                  <Field label="Why I stopped" htmlFor="ed-dnf-reason" className="sm:col-span-2">
                    <input id="ed-dnf-reason" className={input} value={form.dnf_reason} onChange={(e) => set('dnf_reason', e.target.value)} />
                  </Field>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-medium text-cozy-text">Cover image (upload a file or paste a link)</p>
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload cover image"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-cozy-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-cozy-primary file:text-xs file:bg-cozy-paper file:text-cozy-text file:cursor-pointer"
                />
                <input type="url" aria-label="Cover image URL" className={input} value={form.cover_url} onChange={(e) => set('cover_url', e.target.value)} placeholder="Or paste cover image URL…" />
              </div>
            </Section>

            <Section title="Bookshelf spine">
              <div className="flex gap-4 items-start">
                <div
                  aria-hidden="true"
                  style={spineStyle(form)}
                  className="w-7 h-24 shrink-0 rounded-t-sm shadow-[inset_-3px_0_0_rgba(0,0,0,0.18),inset_2px_0_0_rgba(255,255,255,0.15)]"
                />
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="space-y-1.5">
                    <p id="ed-spine-color" className="text-xs font-medium text-cozy-text">Spine colour</p>
                    <div role="radiogroup" aria-labelledby="ed-spine-color" className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!form.extra.spine_color}
                        onClick={() => setExtra('spine_color', '')}
                        title="Auto (by genre)"
                        className={`h-7 px-2.5 rounded-full text-[11px] font-medium border transition ${
                          !form.extra.spine_color ? 'bg-cozy-accent-strong text-white border-cozy-accent' : 'bg-cozy-bg text-cozy-text border-cozy-primary hover:border-cozy-accent'
                        }`}
                      >
                        Auto
                      </button>
                      {SPINE_SWATCHES.map((s) => {
                        const active = form.extra.spine_color === s.color;
                        return (
                          <button
                            key={s.color}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={s.label}
                            title={s.label}
                            onClick={() => setExtra('spine_color', s.color)}
                            style={{ backgroundColor: s.color }}
                            className={`w-7 h-7 rounded-full border border-black/10 transition ${
                              active ? 'ring-2 ring-cozy-accent ring-offset-2 ring-offset-cozy-card' : 'hover:scale-110'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-cozy-text">Spine pattern</p>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Spine pattern">
                      {SPINE_STYLES.map((st) => {
                        const active = (form.extra.spine_style || 'plain') === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setExtra('spine_style', st.key === 'plain' ? '' : st.key)}
                            aria-pressed={active}
                            className={pill(active)}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="How it felt">
              <div className="space-y-1">
                <p className="text-xs font-medium text-cozy-text">Spice level</p>
                <RatingInput label="Spice level" value={form.spice} onChange={(v) => set('spice', v)} icon="🌶️" allowZero />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-cozy-text">Mood</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Mood">
                  {MOODS.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => set('mood', form.mood === m.key ? '' : m.key)}
                      aria-pressed={form.mood === m.key}
                      title={m.label}
                      aria-label={m.label}
                      className={`w-10 h-10 rounded-xl text-xl border transition ${
                        form.mood === m.key ? 'bg-cozy-accent/20 border-cozy-accent scale-110' : 'bg-cozy-bg border-cozy-primary/60 hover:border-cozy-accent'
                      }`}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-cozy-text">Tropes</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...TROPES, ...form.tropes.filter((t) => !TROPES.includes(t))].map((t) => (
                    <button key={t} type="button" onClick={() => toggleTrope(t)} aria-pressed={form.tropes.includes(t)} className={pill(form.tropes.includes(t))}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    aria-label="Custom trope"
                    className={input}
                    value={customTrope}
                    onChange={(e) => setCustomTrope(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTrope();
                      }
                    }}
                    placeholder="Add your own trope…"
                  />
                  <button type="button" onClick={addCustomTrope} disabled={!customTrope.trim()} className={softButton}>Add</button>
                </div>
              </div>
            </Section>

            <Section title="Review">
              <Field label="Summary & diary notes" htmlFor="ed-summary">
                <textarea id="ed-summary" rows={3} className={`${input} resize-y`} value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="What happened, and what you want to remember…" />
              </Field>
              <Field label="My review" htmlFor="ed-review">
                <textarea id="ed-review" rows={4} className={`${input} resize-y`} value={form.review} onChange={(e) => set('review', e.target.value)} placeholder="Your honest thoughts, reactions, favourite moments…" />
              </Field>
              <div className="flex flex-wrap gap-5">
                <Toggle checked={form.review_done} onChange={(v) => set('review_done', v)} label="Review written" />
                <Toggle checked={form.favorite} onChange={(v) => set('favorite', v)} label="All-time favourite" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-cozy-text">Favourite quotes</p>
                {form.quotes.map((quote, idx) => (
                  <div key={idx} className="bg-cozy-paper border border-cozy-primary/60 rounded-xl p-3 flex items-start justify-between gap-3">
                    <p className="font-serif italic text-xs leading-relaxed text-cozy-text">
                      <span className="text-cozy-accent-ink text-base not-italic mr-1">“</span>{quote}
                    </p>
                    <button type="button" onClick={() => set('quotes', form.quotes.filter((_, i) => i !== idx))} className="text-xs text-cozy-accent-ink p-1" aria-label="Remove quote">
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    aria-label="New quote"
                    className={`${input} font-serif italic`}
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addQuote();
                      }
                    }}
                    placeholder="Paste a memorable line…"
                  />
                  <button type="button" onClick={addQuote} disabled={!newQuote.trim()} className={softButton}>+ Quote</button>
                </div>
              </div>
            </Section>
          </>
        )}

        {error && (
          <p role="alert" className="text-xs text-cozy-accent-ink bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-3 border-t border-cozy-border flex items-center justify-between gap-3 flex-wrap">
          {isNew ? <span /> : (
            <button type="button" onClick={handleDelete} className="text-xs text-[#a24b4b] dark:text-red-300 hover:underline">
              Delete book
            </button>
          )}
          <div className="flex items-center gap-3">
            {saved && <span role="status" className="text-xs text-[#2e6b48] dark:text-green-300 font-medium animate-fade-in">✓ Saved</span>}
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-cozy-muted hover:text-cozy-text transition">
              {isNew ? 'Cancel' : 'Close'}
            </button>
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? 'Saving…' : isNew ? '✨ Add book' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
