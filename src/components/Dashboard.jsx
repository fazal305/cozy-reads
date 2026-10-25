import { useMemo } from 'react';
import JournalShell from './JournalShell';
import { useReadingGoal } from '../hooks/useReadingGoal';
import { JournalContext } from '../lib/journalContext';
import { supabaseBackend } from '../lib/backend';

export default function Dashboard({ user, onSignOut }) {
  const goalApi = useReadingGoal(user.id);
  const journal = useMemo(() => ({ userId: user.id, backend: supabaseBackend }), [user.id]);

  return (
    <JournalContext.Provider value={journal}>
      <JournalShell user={user} onSignOut={onSignOut} goalApi={goalApi} />
    </JournalContext.Provider>
  );
}
