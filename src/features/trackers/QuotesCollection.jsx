import { useState } from 'react';
import { input, softButton } from '../../lib/ui';
import { SectionTitle, Empty } from './parts';

function quoteText(q) {
  if (typeof q === 'string') return q.trim();
  return String(q?.text || '').trim();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export default function QuotesCollection({ books, openEditor }) {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(null);

  const quotes = books.flatMap((book) =>
    (Array.isArray(book.quotes) ? book.quotes : [])
      .map(quoteText)
      .filter(Boolean)
      .map((text, i) => ({ id: `${book.id}-${i}`, text, book })),
  );
  const q = query.trim().toLowerCase();
  const shown = q
    ? quotes.filter((x) => `${x.text} ${x.book.title} ${x.book.author || ''}`.toLowerCase().includes(q))
    : quotes;

  const copy = async (item) => {
    const ok = await copyText(`“${item.text}” — ${item.book.title}${item.book.author ? `, ${item.book.author}` : ''}`);
    setCopied(ok ? item.id : 'failed');
    setTimeout(() => setCopied((c) => (c === item.id || c === 'failed' ? null : c)), 1800);
  };

  return (
    <div>
      <SectionTitle icon="💬" title="Quotes collection" subtitle={`${quotes.length} saved ${quotes.length === 1 ? 'quote' : 'quotes'} · add more from any book's journal`} />

      <input type="search" aria-label="Search quotes" className={`${input} mb-4`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotes, titles or authors…" />
      <p className="sr-only" aria-live="polite">
        {copied === 'failed' ? 'Could not copy the quote.' : copied ? 'Quote copied.' : ''}
      </p>

      {shown.length === 0 ? (
        <Empty>{q ? 'No quotes match your search.' : 'No quotes yet. Save a favourite line in a book’s journal.'}</Empty>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {shown.map((item) => (
            <li key={item.id} className="rounded-2xl border border-cozy-border bg-cozy-bg/50 p-4 flex flex-col gap-3">
              <blockquote className="font-serif italic text-cozy-text text-sm leading-relaxed break-words">
                <span className="text-cozy-accent-ink text-lg not-italic mr-0.5" aria-hidden="true">“</span>
                {item.text}
              </blockquote>
              <div className="flex items-center justify-between gap-2 mt-auto">
                <button type="button" onClick={() => openEditor(item.book)} className="min-w-0 text-left text-xs text-cozy-muted hover:text-cozy-accent-ink truncate">
                  — {item.book.title}{item.book.author ? `, ${item.book.author}` : ''}
                </button>
                <button type="button" onClick={() => copy(item)} className={`${softButton} shrink-0`} aria-label={`Copy quote from ${item.book.title}`}>
                  {copied === item.id ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
