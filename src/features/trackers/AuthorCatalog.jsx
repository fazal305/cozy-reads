import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { statusLabel } from '../../lib/bookMeta';
import { input, pill } from '../../lib/ui';
import { SectionTitle, ErrorNote, Empty, Stars } from './parts';
import { normName, useRunner } from './trackerUtils';

function favouriteBook(read) {
  return [...read].sort((a, b) => (b.rating || 0) - (a.rating || 0) || Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)))[0] || null;
}

export default function AuthorCatalog({ books, openEditor }) {
  const { entries, add, remove } = useEntries('trackers.favorite_authors');
  const { error, run } = useRunner();
  const [query, setQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);

  const starred = {};
  entries.forEach((e) => {
    starred[normName(e.data?.name)] = e;
  });

  const groups = {};
  books.filter((b) => b.author?.trim()).forEach((b) => {
    const key = normName(b.author);
    if (!groups[key]) groups[key] = { key, name: b.author.trim(), books: [] };
    groups[key].books.push(b);
  });

  const q = query.trim().toLowerCase();
  const authors = Object.values(groups)
    .map((g) => {
      const read = g.books.filter((b) => b.status === 'read');
      const rated = read.filter((b) => b.rating);
      const avg = rated.length ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : null;
      return { ...g, read, avg, favourite: favouriteBook(read.filter((b) => b.rating || b.favorite)), star: starred[g.key] };
    })
    .filter((a) => (!starredOnly || a.star) && (!q || a.key.includes(q) || a.books.some((b) => b.title.toLowerCase().includes(q))))
    .sort((a, b) => Number(Boolean(b.star)) - Number(Boolean(a.star)) || b.read.length - a.read.length || a.name.localeCompare(b.name));

  const toggleStar = (author) => {
    if (author.star) return run(remove(author.star.id));
    return run(add({ data: { name: author.name } }));
  };

  return (
    <div>
      <SectionTitle icon="✍️" title="Favourite authors" subtitle={`${Object.keys(groups).length} authors in your library · ${entries.length} starred`} />
      <ErrorNote error={error} />

      <div className="flex gap-2 mb-4">
        <input type="search" aria-label="Search authors" className={input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search authors or titles…" />
        <button type="button" onClick={() => setStarredOnly(!starredOnly)} aria-pressed={starredOnly} className={`${pill(starredOnly)} shrink-0`}>
          ★ Starred
        </button>
      </div>

      {authors.length === 0 ? (
        <Empty>{q || starredOnly ? 'No authors match.' : 'Add authors to your books to build the catalog.'}</Empty>
      ) : (
        <ul className="space-y-2">
          {authors.map((a) => (
            <li key={a.key} className="rounded-2xl border border-cozy-border">
              <div className="flex items-start gap-3 p-3">
                <button
                  type="button"
                  onClick={() => toggleStar(a)}
                  aria-pressed={Boolean(a.star)}
                  aria-label={`${a.star ? 'Unstar' : 'Star'} ${a.name}`}
                  className={`text-xl leading-none shrink-0 transition hover:scale-110 ${a.star ? 'text-cozy-accent-ink' : 'text-cozy-muted opacity-50'}`}
                >
                  {a.star ? '★' : '☆'}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-cozy-text truncate">{a.name}</p>
                  <p className="text-xs text-cozy-muted">
                    {a.read.length} read · {a.books.length} in library · avg{' '}
                    {a.avg === null ? '–' : `${a.avg.toFixed(1)}★`}
                  </p>
                  {a.favourite && (
                    <p className="text-xs text-cozy-text mt-1 truncate">
                      <span className="font-semibold">Favourite:</span>{' '}
                      <button type="button" onClick={() => openEditor(a.favourite)} className="text-cozy-accent-ink hover:underline">
                        {a.favourite.title}
                      </button>{' '}
                      <Stars value={a.favourite.rating} />
                    </p>
                  )}
                  <details className="mt-1.5 group">
                    <summary className="text-[11px] text-cozy-muted cursor-pointer hover:text-cozy-accent-ink w-fit">
                      Catalog ({a.books.length})
                    </summary>
                    <ul className="mt-1.5 space-y-1">
                      {a.books.map((b) => (
                        <li key={b.id} className="flex items-center gap-2 text-xs">
                          <button type="button" onClick={() => openEditor(b)} className="flex-1 min-w-0 truncate text-left text-cozy-text hover:text-cozy-accent-ink">
                            {b.title}
                          </button>
                          <span className="text-[10px] text-cozy-muted shrink-0">{statusLabel(b.status)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
