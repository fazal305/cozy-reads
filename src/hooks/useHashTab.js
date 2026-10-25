import { useState, useEffect, useCallback } from 'react';

function readHash(ids, fallback) {
  const hash = window.location.hash.slice(1);
  return ids.includes(hash) ? hash : fallback;
}

export function useHashTab(ids, fallback) {
  const [tab, setTab] = useState(() => readHash(ids, fallback));

  useEffect(() => {
    const onHashChange = () => setTab(readHash(ids, fallback));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [ids, fallback]);

  const selectTab = useCallback((id) => {
    if (window.location.hash.slice(1) !== id) window.location.hash = id;
    window.scrollTo({ top: 0 });
  }, []);

  return [tab, selectTab];
}
