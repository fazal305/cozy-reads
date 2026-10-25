import { useState, useEffect, useCallback, useRef } from 'react';
import { useJournal } from '../lib/journalContext';

function message(error, fallback) {
  return error?.message || fallback;
}

// kind is namespaced by feature: '<feature>.<thing>', e.g. 'trackers.reading_log'.
export function useEntries(kind) {
  const { userId, backend } = useJournal();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const entriesRef = useRef(entries);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: listError } = await backend.entries.list(userId, kind);
    if (listError) {
      setError('Could not load your entries. Check your connection and try again.');
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }, [backend, userId, kind]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(async ({ data = {}, entry_date = null } = {}) => {
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    setEntries((prev) => [{ id: tempId, kind, data, entry_date, created_at: now, updated_at: now }, ...prev]);

    const { data: row, error: insertError } = await backend.entries.insert(userId, { kind, data, entry_date });
    if (insertError || !row) {
      setEntries((prev) => prev.filter((e) => e.id !== tempId));
      return { data: null, error: message(insertError, 'Could not save the entry.') };
    }
    setEntries((prev) => prev.map((e) => (e.id === tempId ? row : e)));
    return { data: row, error: null };
  }, [backend, userId, kind]);

  // patch: { data?, entry_date? }. `data` replaces the stored object, so merge before calling.
  const update = useCallback(async (id, patch) => {
    const previous = entriesRef.current.find((e) => e.id === id);
    if (!previous) return { data: null, error: 'Entry not found.' };
    if (String(id).startsWith('tmp-')) return { data: null, error: 'Still saving this entry, try again in a moment.' };

    const allowed = {};
    if ('data' in patch) allowed.data = patch.data;
    if ('entry_date' in patch) allowed.entry_date = patch.entry_date;

    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...allowed } : e)));
    const { data: row, error: updateError } = await backend.entries.update(userId, id, allowed);
    if (updateError || !row) {
      setEntries((prev) => prev.map((e) => (e.id === id ? previous : e)));
      return { data: null, error: message(updateError, 'Could not save the entry.') };
    }
    setEntries((prev) => prev.map((e) => (e.id === id ? row : e)));
    return { data: row, error: null };
  }, [backend, userId]);

  const remove = useCallback(async (id) => {
    const list = entriesRef.current;
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return { error: null };
    const removed = list[index];

    setEntries((prev) => prev.filter((e) => e.id !== id));
    const { error: deleteError } = await backend.entries.remove(userId, id);
    if (deleteError) {
      setEntries((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
      return { error: message(deleteError, 'Could not delete the entry.') };
    }
    return { error: null };
  }, [backend, userId]);

  return { entries, loading, error, reload, add, update, remove };
}
