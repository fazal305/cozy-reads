// Props contract (from JournalShell):
//   userId     - signed-in user's id
//   books      - all user_books rows, already loaded once by the shell
//   booksApi   - useBooks() result: { books, loading, error, reload, addBook, updateBook, deleteBook, uploadCover }
//   openEditor - optional: openEditor(book) edits a book, openEditor(null, defaults) adds one
// Store feature data with useEntries('extras.<thing>') from src/hooks/useEntries.js.
import { card } from '../../lib/ui';

export default function ExtrasTab() {
  return (
    <section className={card}>
      <h2 className="font-serif text-xl text-cozy-text">
        <span aria-hidden="true">🧺</span> Extras
      </h2>
    </section>
  );
}
