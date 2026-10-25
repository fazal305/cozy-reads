import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import BookDiaryModal from './BookDiaryModal';

export default function LibraryGrid({ userId }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeBook, setActiveBook] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [firstQuote, setFirstQuote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  const fetchBooks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch {
      // Table might not exist yet if migration isn't run
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleFileUpload = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    setUploadProgress(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      return data?.publicUrl || null;
    } catch {
      // Fallback: If covers bucket is not created or RLS fails, use base64 data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    } finally {
      setUploadProgress(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      let finalCover = coverUrl.trim();

      if (coverFile) {
        const uploadedUrl = await handleFileUpload(coverFile);
        if (uploadedUrl) finalCover = uploadedUrl;
      }

      const quotesList = firstQuote.trim() ? [firstQuote.trim()] : [];

      const { data, error } = await supabase
        .from('user_books')
        .insert({
          user_id: userId,
          title: title.trim(),
          author: author.trim(),
          rating,
          cover_url: finalCover,
          summary: summary.trim(),
          quotes: quotesList,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) setBooks((prev) => [data, ...prev]);

      // Reset form
      setTitle('');
      setAuthor('');
      setRating(5);
      setCoverUrl('');
      setCoverFile(null);
      setSummary('');
      setFirstQuote('');
      setShowAddForm(false);
    } catch (err) {
      alert(err.message || 'Failed to add book. Make sure you ran the SQL migration in Supabase!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBook = (updated) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setActiveBook(updated);
  };

  const handleDeleteBook = async (bookId) => {
    try {
      const { error } = await supabase.from('user_books').delete().eq('id', bookId).eq('user_id', userId);
      if (error) throw error;
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      setActiveBook(null);
    } catch (err) {
      alert(err.message || 'Failed to delete book');
    }
  };

  return (
    <section className="bg-cozy-card rounded-2xl border border-cozy-border p-6 shadow-sm animate-fade-in font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div>
          <h2 className="font-serif text-xl text-cozy-text flex items-center gap-2">
            <span aria-hidden="true">📚</span> Visual Bookshelf
          </h2>
          <p className="text-cozy-muted text-sm mt-0.5">
            {books.length} {books.length === 1 ? 'book' : 'books'} on your shelf · Tap any cover to open its reading diary
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-cozy-accent text-white text-xs font-medium hover:bg-[#d97979] active:scale-95 transition shadow-sm flex items-center gap-1.5"
        >
          <span>{showAddForm ? '✕ Close' : '+ Add Book to Shelf'}</span>
        </button>
      </div>

      {/* Add Book Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleAddBook}
          className="mb-8 p-5 rounded-2xl bg-cozy-bg border border-cozy-primary space-y-4 animate-fade-in"
        >
          <h3 className="font-serif text-base text-cozy-text font-semibold">
            Add a New Book to Your Shelf
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="book-title" className="block text-xs font-medium text-cozy-text">
                Book Title *
              </label>
              <input
                id="book-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Twisted Hate, Fourth Wing"
                className="w-full px-3 py-2 rounded-xl border border-cozy-primary/60 bg-white text-cozy-text text-xs focus:outline-none focus:ring-2 focus:ring-cozy-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="book-author" className="block text-xs font-medium text-cozy-text">
                Author
              </label>
              <input
                type="text"
                id="book-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Ana Huang, Rebecca Yarros"
                className="w-full px-3 py-2 rounded-xl border border-cozy-primary/60 bg-white text-cozy-text text-xs focus:outline-none focus:ring-2 focus:ring-cozy-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="block text-xs font-medium text-cozy-text">
                Star Rating
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    aria-label={`Rate ${num} star${num > 1 ? 's' : ''}`}
                    className="text-xl text-amber-400 hover:scale-125 transition focus:outline-none"
                  >
                    {num <= rating ? '★' : '☆'}
                  </button>
                ))}
                <span className="text-xs text-cozy-muted font-medium ml-2">
                  {rating} / 5
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="block text-xs font-medium text-cozy-text">
                Cover Image (Upload File or Paste Link)
              </p>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload cover image"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-cozy-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-white file:text-cozy-text file:border file:border-cozy-primary file:cursor-pointer hover:file:bg-cozy-card"
                />
              </div>
              <input
                type="url"
                aria-label="Cover image URL"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Or paste cover image URL..."
                className="w-full mt-1.5 px-3 py-1.5 rounded-xl border border-cozy-primary/60 bg-white text-cozy-text text-xs focus:outline-none focus:ring-2 focus:ring-cozy-accent"
              />
            </div>
          </div>

          {/* Quick Summary & Quote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label htmlFor="book-summary" className="block text-xs font-medium text-cozy-text">
                Book Summary / Review (Optional)
              </label>
              <textarea
                id="book-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="What did you think of it?"
                className="w-full px-3 py-2 rounded-xl border border-cozy-primary/60 bg-white text-cozy-text text-xs focus:outline-none focus:ring-2 focus:ring-cozy-accent resize-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="book-quote" className="block text-xs font-medium text-cozy-text">
                First Favorite Quote (Optional)
              </label>
              <textarea
                id="book-quote"
                value={firstQuote}
                onChange={(e) => setFirstQuote(e.target.value)}
                rows={2}
                placeholder="Paste your favorite line from the book..."
                className="w-full px-3 py-2 rounded-xl border border-cozy-primary/60 bg-white text-cozy-text text-xs focus:outline-none focus:ring-2 focus:ring-cozy-accent resize-none font-serif italic"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs text-cozy-muted hover:text-cozy-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadProgress}
              className="px-5 py-2 rounded-xl bg-cozy-accent text-white text-xs font-medium hover:bg-[#d97979] transition disabled:opacity-50"
            >
              {submitting || uploadProgress ? 'Adding to Shelf…' : '✨ Add to Shelf'}
            </button>
          </div>
        </form>
      )}

      {/* Bookshelf Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[2/3] bg-cozy-bg rounded-2xl border border-cozy-primary/40 animate-pulse" />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {books.map((book) => (
            <button
              type="button"
              key={book.id}
              onClick={() => setActiveBook(book)}
              className="group text-left bg-white border border-cozy-primary/50 rounded-2xl p-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-200 flex flex-col justify-between"
            >
              {/* Cover Card */}
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-cozy-bg mb-2.5 shadow-sm border border-cozy-primary/30">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-between p-3 text-center bg-gradient-to-br from-[#FFF5F5] via-[#FCE8E8] to-[#F4B5B5]">
                    <span className="text-2xl mt-4">📖</span>
                    <div>
                      <h4 className="font-serif text-xs font-bold text-cozy-text leading-tight line-clamp-3">
                        {book.title}
                      </h4>
                      {book.author && (
                        <p className="text-[10px] text-cozy-muted font-sans mt-1 truncate">
                          {book.author}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-cozy-accent font-semibold mb-1">
                      Cozy Read
                    </span>
                  </div>
                )}

                {/* Rating Badge Top Right */}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-500 shadow-sm border border-cozy-primary/40">
                  <span aria-label={`${book.rating} out of 5 stars`}>{'★'.repeat(book.rating)}</span>
                </div>
              </div>

              {/* Title & Author Info */}
              <div className="text-left px-0.5">
                <h4 className="font-serif text-sm font-semibold text-cozy-text truncate leading-tight group-hover:text-cozy-accent transition">
                  {book.title}
                </h4>
                {book.author ? (
                  <p className="text-xs text-cozy-muted truncate mt-0.5">
                    {book.author}
                  </p>
                ) : (
                  <p className="text-[11px] text-cozy-muted italic mt-0.5">
                    Tap to open diary
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-cozy-bg rounded-2xl border border-dashed border-cozy-primary/70 space-y-3">
          <div className="text-4xl">🌸 📖</div>
          <h3 className="font-serif text-lg text-cozy-text">
            Your Bookshelf is Ready
          </h3>
          <p className="text-xs text-cozy-muted max-w-sm mx-auto leading-relaxed">
            Add the books you are currently reading or have finished to see their covers displayed on your shelf and collect memorable quotes.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 px-5 py-2 rounded-xl bg-cozy-accent text-white text-xs font-medium hover:bg-[#d97979] transition shadow-sm"
          >
            + Add Your First Book
          </button>
        </div>
      )}

      {/* Diary Modal */}
      {activeBook && (
        <BookDiaryModal
          book={activeBook}
          onClose={() => setActiveBook(null)}
          onUpdateBook={handleUpdateBook}
          onDeleteBook={handleDeleteBook}
        />
      )}
    </section>
  );
}
