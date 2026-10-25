import { createContext, useContext } from 'react';

// { userId, backend }, provided once by the journal shell or the dev preview.
export const JournalContext = createContext(null);

export function useJournal() {
  const value = useContext(JournalContext);
  if (!value) throw new Error('useJournal must be used inside JournalContext');
  return value;
}
