import { useState, useCallback } from 'react';
import { useBooks } from '../hooks/useBooks';
import { useHashTab } from '../hooks/useHashTab';
import { useTheme } from '../hooks/useTheme';
import BookEditor from './BookEditor';
import StickerVault from './StickerVault';
import HomeTab from '../features/home/HomeTab';
import TbrTab from '../features/tbr/TbrTab';
import BookshelfTab from '../features/bookshelf/BookshelfTab';
import TrackersTab from '../features/trackers/TrackersTab';
import ChallengesTab from '../features/challenges/ChallengesTab';
import ExtrasTab from '../features/extras/ExtrasTab';
import JournalTab from '../features/journal/JournalTab';

const CURRENT_YEAR = new Date().getFullYear();

const TABS = [
  { id: 'home', label: 'Home', short: 'Home', icon: '🏡' },
  { id: 'journal', label: 'Journal', short: 'Journal', icon: '📓' },
  { id: 'tbr', label: 'TBR', short: 'TBR', icon: '📌' },
  { id: 'bookshelf', label: 'Bookshelf', short: 'Shelf', icon: '📚' },
  { id: 'trackers', label: 'Trackers', short: 'Trackers', icon: '📊' },
  { id: 'challenges', label: 'Challenges', short: 'Challenge', icon: '🏆' },
  { id: 'extras', label: 'Extras', short: 'Extras', icon: '🧺' },
  { id: 'stickers', label: 'Stickers', short: 'Stickers', icon: '✨' },
];
const TAB_IDS = TABS.map((t) => t.id);

// Expects JournalContext ({ userId, backend }) to be provided by the caller.
export default function JournalShell({ user, onSignOut, goalApi }) {
  const booksApi = useBooks();
  const { books } = booksApi;
  const [tab, selectTab] = useHashTab(TAB_IDS, 'home');
  const { theme, toggleTheme } = useTheme();
  const [editor, setEditor] = useState(null);

  const openEditor = useCallback((book, defaults) => setEditor({ book: book || null, defaults }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const tabProps = { userId: user.id, books, booksApi, openEditor };
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-cozy-bg">
      <header className="border-b border-cozy-border bg-cozy-card sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="w-7 h-7" />
            <span className="font-serif text-lg text-cozy-text">Cozy Reads</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={isDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
              className="w-9 h-9 rounded-full border border-cozy-primary bg-cozy-bg text-base flex items-center justify-center hover:border-cozy-accent transition"
            >
              <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
            </button>
            <button onClick={onSignOut} className="text-sm text-cozy-muted hover:text-cozy-accent transition">
              Sign out
            </button>
          </div>
        </div>

        <nav aria-label="Journal sections" className="hidden sm:block max-w-3xl mx-auto px-4">
          <ul className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    selectTab(t.id);
                  }}
                  aria-current={tab === t.id ? 'page' : undefined}
                  className={`block px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                    tab === t.id
                      ? 'border-cozy-accent text-cozy-accent'
                      : 'border-transparent text-cozy-muted hover:text-cozy-text'
                  }`}
                >
                  <span aria-hidden="true" className="mr-1">{t.icon}</span>
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 pb-28 sm:py-8">
        {tab === 'home' && <HomeTab {...tabProps} goalApi={goalApi} onSelectTab={selectTab} />}
        {tab === 'journal' && <JournalTab {...tabProps} />}
        {tab === 'tbr' && <TbrTab {...tabProps} />}
        {tab === 'bookshelf' && <BookshelfTab {...tabProps} />}
        {tab === 'trackers' && <TrackersTab {...tabProps} />}
        {tab === 'challenges' && <ChallengesTab {...tabProps} />}
        {tab === 'extras' && <ExtrasTab {...tabProps} />}
        {tab === 'stickers' && <StickerVault />}
      </main>

      <footer className="hidden sm:block border-t border-cozy-border py-6 text-center text-xs text-cozy-muted">
        © {CURRENT_YEAR} Cozy Reads
      </footer>

      <nav
        aria-label="Journal sections"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-cozy-card/95 backdrop-blur border-t border-cozy-border pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-8">
          {TABS.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  selectTab(t.id);
                }}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                  tab === t.id ? 'text-cozy-accent' : 'text-cozy-muted'
                }`}
              >
                <span aria-hidden="true" className={`text-lg leading-none ${tab === t.id ? '' : 'opacity-70'}`}>{t.icon}</span>
                <span className="truncate max-w-full px-0.5">{t.short}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {editor && (
        <BookEditor
          key={editor.book?.id || 'new'}
          book={editor.book}
          defaults={editor.defaults}
          booksApi={booksApi}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
