import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const CURRENT_YEAR = new Date().getFullYear();

export function useReadingGoal(userId) {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const fetchGoal = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('target_year', CURRENT_YEAR)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setGoal(data);
    } catch {
      setError('Failed to load your reading data. Check your connection and refresh.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const logBook = useCallback(async () => {
    if (!goal) return;

    const previous = goal.books_read_count;
    const next = previous + 1;

    setGoal(g => ({ ...g, books_read_count: next }));

    const { error: updateError } = await supabase
      .from('reading_goals')
      .update({ books_read_count: next, updated_at: new Date().toISOString() })
      .eq('id', goal.id)
      .eq('user_id', userId);

    if (updateError) {
      setGoal(g => ({ ...g, books_read_count: previous }));
      return { error: 'Could not save — check your connection and try again.' };
    }

    return { error: null };
  }, [goal, userId]);

  const updateChallenge = useCallback(async (newTarget) => {
    if (!goal) return;
    setGoal(g => ({ ...g, books_challenge_type: newTarget }));
    await supabase
      .from('reading_goals')
      .update({ books_challenge_type: newTarget, updated_at: new Date().toISOString() })
      .eq('id', goal.id)
      .eq('user_id', userId);
  }, [goal, userId]);

  const updateTropes = useCallback((tropes) => {
    if (!goal) return;
    setGoal(g => ({ ...g, favorite_tropes: tropes }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await supabase
        .from('reading_goals')
        .update({ favorite_tropes: tropes, updated_at: new Date().toISOString() })
        .eq('id', goal.id)
        .eq('user_id', userId);
    }, 600);
  }, [goal, userId]);

  return { goal, loading, error, logBook, updateChallenge, updateTropes, refetch: fetchGoal };
}
