import { useState } from 'react';
import JournalShell from '../components/JournalShell';
import { JournalContext } from '../lib/journalContext';
import { createMockBackend, useMockReadingGoal, DEMO_USER } from './mockApi';

export default function DemoShell() {
  const [journal] = useState(() => ({ userId: DEMO_USER.id, backend: createMockBackend() }));
  const goalApi = useMockReadingGoal();

  return (
    <JournalContext.Provider value={journal}>
      <div className="bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100 text-center text-xs py-1">
        Dev preview with sample data. Nothing is saved.
      </div>
      <JournalShell user={DEMO_USER} onSignOut={() => {}} goalApi={goalApi} />
    </JournalContext.Provider>
  );
}
