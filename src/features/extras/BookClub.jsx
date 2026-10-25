import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { today } from '../../lib/bookMeta';
import { input, primaryButton, softButton } from '../../lib/ui';
import { BookSelect, DeleteButton, Empty, ErrorNote, Field, Heading, Panel, SafeLink } from './shared';
import { bookTitle, countdown, dateLabel, plural, uid, useRunner } from './utils';

const STARTER_QUESTIONS = [
  'What was your first impression of the book?',
  'Which character did you connect with most, and why?',
  'Which scene or quote has stayed with you?',
  'Did the ending work for you?',
  'How would you rate it, and who would you recommend it to?',
];

const sortMeetings = (list) => [...list].sort((a, b) => String(a.date).localeCompare(String(b.date)));

function MeetingForm({ clubName, books, onAdd }) {
  const [bookId, setBookId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [busy, setBusy] = useState(false);
  const prefix = `meet-${clubName.replace(/\W+/g, '-')}`;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const result = await onAdd({
      id: uid(),
      book_id: bookId || null,
      book_title: bookId ? bookTitle(books, bookId) : title.trim(),
      date,
      time,
      location: place.trim(),
      questions: [],
      notes: '',
    });
    setBusy(false);
    if (!result?.error) {
      setBookId('');
      setTitle('');
      setTime('');
      setPlace('');
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-2 grid-cols-2 sm:grid-cols-6 sm:items-end">
      <Field label="Book" id={`${prefix}-book`} className="col-span-2 sm:col-span-3">
        <BookSelect id={`${prefix}-book`} books={books} value={bookId} onChange={setBookId} placeholder="Other title…" />
      </Field>
      <Field label="Or type a title" id={`${prefix}-title`} className="col-span-2 sm:col-span-3">
        <input id={`${prefix}-title`} className={input} value={title} onChange={(e) => setTitle(e.target.value)} disabled={!!bookId} placeholder="Book title" />
      </Field>
      <Field label="Date" id={`${prefix}-date`} className="sm:col-span-3">
        <input id={`${prefix}-date`} type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      <Field label="Time" id={`${prefix}-time`} className="sm:col-span-3">
        <input id={`${prefix}-time`} type="time" className={input} value={time} onChange={(e) => setTime(e.target.value)} />
      </Field>
      <Field label="Location or link" id={`${prefix}-place`} className="col-span-2 sm:col-span-4">
        <input id={`${prefix}-place`} className={input} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Café Lumen or https://…" />
      </Field>
      <button type="submit" disabled={busy || !date || (!bookId && !title.trim())} className={`${primaryButton} col-span-2 sm:col-span-2`}>
        + Meeting
      </button>
    </form>
  );
}

function Discussion({ meeting, onSave }) {
  const [questions, setQuestions] = useState(meeting.questions || []);
  const [notes, setNotes] = useState(meeting.notes || '');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const base = `disc-${meeting.id}`;

  const change = (next) => {
    setQuestions(next);
    setSaved(false);
  };

  const addQuestion = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    change([...questions, { id: uid(), text: draft.trim(), notes: '' }]);
    setDraft('');
  };

  const save = async () => {
    setBusy(true);
    const result = await onSave({ questions, notes });
    setBusy(false);
    setSaved(!result?.error);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-cozy-primary/40">
      {questions.length === 0 && (
        <button type="button" onClick={() => change(STARTER_QUESTIONS.map((text) => ({ id: uid(), text, notes: '' })))} className={softButton}>
          Use starter questions
        </button>
      )}
      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={q.id} className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <label htmlFor={`${base}-${q.id}`} className="text-sm text-cozy-text break-words min-w-0">
                <span className="text-cozy-muted">{i + 1}.</span> {q.text}
              </label>
              <button type="button" onClick={() => change(questions.filter((x) => x.id !== q.id))} aria-label={`Remove question ${i + 1}`} className="text-xs text-cozy-muted hover:text-cozy-accent shrink-0">
                ✕
              </button>
            </div>
            <textarea
              id={`${base}-${q.id}`}
              rows={2}
              className={input}
              value={q.notes}
              onChange={(e) => change(questions.map((x) => (x.id === q.id ? { ...x, notes: e.target.value } : x)))}
              placeholder="Your thoughts"
            />
          </li>
        ))}
      </ol>
      <form onSubmit={addQuestion} className="flex gap-2">
        <label htmlFor={`${base}-new`} className="sr-only">New question</label>
        <input id={`${base}-new`} className={input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a question" />
        <button type="submit" disabled={!draft.trim()} className={softButton}>Add</button>
      </form>
      <Field label="Meeting notes" id={`${base}-notes`}>
        <textarea
          id={`${base}-notes`}
          rows={3}
          className={input}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="Who came, the hot takes, next month's pick…"
        />
      </Field>
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={primaryButton}>Save discussion</button>
        {saved && <span role="status" className="text-xs text-cozy-muted">Saved</span>}
      </div>
    </div>
  );
}

function Meeting({ meeting, clubName, onOpen, onSave, onRemove, highlight = false }) {
  const [open, setOpen] = useState(false);
  const isLink = /^https?:\/\//i.test(meeting.location || '');
  const upcoming = meeting.date >= today();

  return (
    <li className={`rounded-xl border p-3 bg-cozy-paper min-w-0 ${highlight ? 'border-cozy-accent' : 'border-cozy-primary/60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-serif text-sm text-cozy-text break-words">{meeting.book_title || 'Untitled book'}</p>
          <p className="text-xs text-cozy-muted">
            {clubName && <span>{clubName} · </span>}
            {dateLabel(meeting.date)}
            {meeting.time && ` · ${meeting.time}`}
            {upcoming && <span className="text-cozy-accent font-medium"> · {countdown(meeting.date)}</span>}
          </p>
          {meeting.location && (
            <p className="text-xs text-cozy-text mt-0.5">
              <span aria-hidden="true">{isLink ? '🔗 ' : '📍 '}</span>
              {isLink ? <SafeLink href={meeting.location}>Join link</SafeLink> : <span className="break-words">{meeting.location}</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onOpen && meeting.book_id && (
            <button type="button" onClick={onOpen} className={`${softButton} px-2`} aria-label={`Open ${meeting.book_title}`}>📖</button>
          )}
          {onRemove && <DeleteButton label={`Delete meeting for ${meeting.book_title}`} onConfirm={onRemove} />}
        </div>
      </div>
      {onSave && (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-2 text-xs text-cozy-accent hover:underline">
            {open ? 'Hide discussion' : `Discussion${meeting.questions?.length ? ` (${plural(meeting.questions.length, 'question')})` : ''}`}
          </button>
          {open && <div className="mt-2"><Discussion meeting={meeting} onSave={onSave} /></div>}
        </>
      )}
    </li>
  );
}

export default function BookClub({ books, openEditor }) {
  const clubs = useEntries('extras.book_club');
  const { error, run } = useRunner();
  const [name, setName] = useState('');
  const now = today();

  const addClub = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await run(clubs.add({ data: { name: name.trim(), meetings: [] } }));
    if (!result?.error) setName('');
  };

  const saveMeetings = (club, meetings) => run(clubs.update(club.id, { data: { ...club.data, meetings } }));
  const openBook = (id) => {
    const book = books.find((b) => b.id === id);
    if (book) openEditor(book);
  };

  const upcoming = sortMeetings(
    clubs.entries.flatMap((club) => (club.data.meetings || []).filter((m) => m.date >= now).map((m) => ({ ...m, clubName: club.data.name })))
  );

  return (
    <div className="space-y-5">
      <Heading title="Book club" subtitle={`${plural(clubs.entries.length, 'club')} · ${plural(upcoming.length, 'upcoming meeting')}`} />
      <ErrorNote error={error || clubs.error} />

      <form onSubmit={addClub} className="flex gap-2 max-w-md">
        <label htmlFor="club-name" className="sr-only">Club name</label>
        <input id="club-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="New club name" />
        <button type="submit" disabled={!name.trim()} className={`${primaryButton} shrink-0`}>+ Club</button>
      </form>

      {upcoming.length > 0 && (
        <Panel>
          <h4 className="font-serif text-base text-cozy-text mb-3">Coming up</h4>
          <ul className="space-y-2">
            {upcoming.map((m, i) => (
              <Meeting key={m.id} meeting={m} clubName={m.clubName} highlight={i === 0} onOpen={() => openBook(m.book_id)} />
            ))}
          </ul>
        </Panel>
      )}

      {clubs.loading ? null : clubs.entries.length === 0 ? (
        <Empty>Start a club to plan meetings and discussion questions.</Empty>
      ) : (
        clubs.entries.map((club) => {
          const meetings = club.data.meetings || [];
          const future = sortMeetings(meetings.filter((m) => m.date >= now));
          const past = sortMeetings(meetings.filter((m) => m.date < now)).reverse();
          const patchMeeting = (id, patch) => saveMeetings(club, meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)));
          return (
            <Panel key={club.id} className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-serif text-base text-cozy-text break-words min-w-0"><span aria-hidden="true">☕</span> {club.data.name}</h4>
                <DeleteButton label={`Delete club ${club.data.name}`} onConfirm={() => run(clubs.remove(club.id))} />
              </div>
              <MeetingForm clubName={club.data.name} books={books} onAdd={(m) => saveMeetings(club, [...meetings, m])} />
              {meetings.length ? (
                <ul className="space-y-2">
                  {[...future, ...past].map((m) => (
                    <Meeting
                      key={m.id}
                      meeting={m}
                      onOpen={() => openBook(m.book_id)}
                      onSave={(patch) => patchMeeting(m.id, patch)}
                      onRemove={() => saveMeetings(club, meetings.filter((x) => x.id !== m.id))}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-cozy-muted italic">No meetings yet.</p>
              )}
            </Panel>
          );
        })
      )}
    </div>
  );
}
