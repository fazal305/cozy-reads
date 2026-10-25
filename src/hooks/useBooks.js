import { useState, useEffect, useCallback, useRef } from 'react';
import { useJournal } from '../lib/journalContext';

const READ_ONLY = ['id', 'user_id', 'created_at', 'updated_at'];

function clean(row) {
  const out = { ...row };
  READ_ONLY.forEach((key) => delete out[key]);
  return out;
}

function message(error, fallback) {
  return error?.message || fallback;
}

export function useBooks() {
  const { userId, backend } = useJournal();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const booksRef = useRef(books);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: listError } = await backend.books.list(userId);
    if (listError) {
      setError('Could not load your books. Check your connection and try again.');
    } else {
      setBooks(data || []);
    }
    setLoading(false);
  }, [backend, userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addBook = useCallback(async (fields) => {
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    setBooks((prev) => [
      { status: 'read', extra: {}, quotes: [], tropes: [], ...fields, id: tempId, created_at: now, updated_at: now },
      ...prev,
    ]);

    const { data, error: insertError } = await backend.books.insert(userId, clean(fields));
    if (insertError || !data) {
      setBooks((prev) => prev.filter((b) => b.id !== tempId));
      return { data: null, error: message(insertError, 'Could not add the book.') };
    }
    setBooks((prev) => prev.map((b) => (b.id === tempId ? data : b)));
    return { data, error: null };
  }, [backend, userId]);

  const updateBook = useCallback(async (id, patch) => {
    const previous = booksRef.current.find((b) => b.id === id);
    if (!previous) return { data: null, error: 'Book not found.' };
    if (String(id).startsWith('tmp-')) return { data: null, error: 'Still saving this book, try again in a moment.' };

    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const { data, error: updateError } = await backend.books.update(userId, id, clean(patch));
    if (updateError || !data) {
      setBooks((prev) => prev.map((b) => (b.id === id ? previous : b)));
      return { data: null, error: message(updateError, 'Could not save your changes.') };
    }
    setBooks((prev) => prev.map((b) => (b.id === id ? data : b)));
    return { data, error: null };
  }, [backend, userId]);

  const deleteBook = useCallback(async (id) => {
    const list = booksRef.current;
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) return { error: null };
    const removed = list[index];

    setBooks((prev) => prev.filter((b) => b.id !== id));
    const { error: deleteError } = await backend.books.remove(userId, id);
    if (deleteError) {
      setBooks((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
      return { error: message(deleteError, 'Could not delete the book.') };
    }
    return { error: null };
  }, [backend, userId]);

  const uploadCover = useCallback(async (file) => {
    const { data, error: uploadError } = await backend.books.uploadCover(userId, file);
    return { data, error: uploadError ? message(uploadError, 'Could not upload the cover.') : null };
  }, [backend, userId]);

  return { books, loading, error, reload, addBook, updateBook, deleteBook, uploadCover };
}
