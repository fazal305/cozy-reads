import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function BookDiaryModal({ book, onClose, onUpdateBook, onDeleteBook }) {
  const [rating, setRating] = useState(book.rating || 5);
  const [summary, setSummary] = useState(book.summary || '');
  const [quotes, setQuotes] = useState(Array.isArray(book.quotes) ? book.quotes : []);
  const [newQuote, setNewQuote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleAddQuote = (e) => {
    e.preventDefault();
    if (!newQuote.trim()) return;
    setQuotes([...quotes, newQuote.trim()]);
    setNewQuote('');
  };

  const handleRemoveQuote = (index) => {
    setQuotes(quotes.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const { data, error } = await supabase
        .from('user_books')
        .update({
          rating,
          summary,
          quotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', book.id)
        .select()
        .single();

      if (error) throw error;
      if (onUpdateBook && data) {
        onUpdateBook(data);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-cozy-card border border-cozy-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 sm:p-8 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diary-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-cozy-bg border border-cozy-primary shrink-0 shadow-sm">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#FFF5F5] to-[#F4B5B5]">
                  <span className="text-xl">📖</span>
                  <span className="font-serif text-[10px] text-cozy-text truncate max-w-full">
                    {book.title}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cozy-accent">
                Reading Journal
              </span>
              <h3 id="diary-title" className="font-serif text-2xl text-cozy-text leading-tight mt-0.5">
                {book.title}
              </h3>
              {book.author && (
                <p className="text-sm text-cozy-muted font-sans mt-0.5">
                  by {book.author}
                </p>
              )}

              {/* Interactive Star Rating */}
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-lg text-amber-400 hover:scale-125 transition active:scale-95 focus:outline-none"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
                <span className="text-xs text-cozy-muted ml-1.5 font-medium">
                  {rating} / 5 Stars
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cozy-bg border border-cozy-primary text-cozy-text hover:bg-cozy-accent hover:text-white flex items-center justify-center text-sm transition"
            aria-label="Close diary"
          >
            ✕
          </button>
        </div>

        {/* Book Summary & Diary Section */}
        <div className="space-y-2">
          <label htmlFor="diary-summary" className="font-serif text-base text-cozy-text font-semibold flex items-center gap-2">
            <span aria-hidden="true">📝</span> Book Summary &amp; Diary Reflections
          </label>
          <textarea
            id="diary-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Write your review, emotional reactions, favorite tropes in this book, and personal reflections..."
            className="w-full px-4 py-3 rounded-2xl border border-cozy-primary bg-cozy-bg text-cozy-text placeholder-cozy-muted text-sm focus:outline-none focus:ring-2 focus:ring-cozy-accent transition font-sans resize-y"
          />
        </div>

        {/* Favorite Quotes Scrapbook */}
        <div className="space-y-3">
          <h4 className="font-serif text-base text-cozy-text font-semibold flex items-center gap-2">
            <span aria-hidden="true">💬</span> Favorite Quotes
          </h4>

          {/* Quotes List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {quotes.map((quote, idx) => (
              <div
                key={idx}
                className="group relative bg-white border border-cozy-primary/60 rounded-xl p-3 text-sm text-cozy-text shadow-sm flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="font-serif text-lg text-cozy-accent select-none leading-none">“</span>
                  <p className="font-serif italic text-xs leading-relaxed">{quote}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuote(idx)}
                  className="opacity-60 hover:opacity-100 text-xs text-cozy-accent hover:bg-red-50 p-1 rounded-md transition"
                  title="Remove quote"
                  aria-label="Remove quote"
                >
                  ✕
                </button>
              </div>
            ))}

            {quotes.length === 0 && (
              <p className="text-xs text-cozy-muted italic bg-cozy-bg p-3 rounded-xl border border-dashed border-cozy-primary text-center">
                No quotes added yet. Paste memorable lines below!
              </p>
            )}
          </div>

          {/* Add Quote Form */}
          <form onSubmit={handleAddQuote} className="flex gap-2">
            <input
              type="text"
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              placeholder="Paste a memorable quote from the book..."
              aria-label="New quote"
              className="flex-1 px-3.5 py-2 rounded-xl border border-cozy-primary bg-cozy-bg text-cozy-text placeholder-cozy-muted text-xs focus:outline-none focus:ring-2 focus:ring-cozy-accent font-serif italic"
            />
            <button
              type="submit"
              disabled={!newQuote.trim()}
              className="px-4 py-2 rounded-xl bg-cozy-primary text-cozy-text text-xs font-semibold hover:bg-cozy-accent hover:text-white transition disabled:opacity-40"
            >
              + Add Quote
            </button>
          </form>
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-3 border-t border-cozy-border flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove "${book.title}" from your bookshelf?`)) {
                onDeleteBook(book.id);
                onClose();
              }
            }}
            className="text-xs text-[#a24b4b] hover:underline"
          >
            Delete from shelf
          </button>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-[#2e6b48] font-medium animate-fade-in">
                ✓ Saved to diary!
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-cozy-muted hover:text-cozy-text transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-cozy-accent text-white text-xs font-medium shadow-sm hover:bg-[#d97979] active:scale-95 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Diary'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
