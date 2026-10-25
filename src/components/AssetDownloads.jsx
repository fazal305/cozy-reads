import { useState } from 'react';
import { supabase } from '../lib/supabase';

const ASSETS = [
  { id: 'planner-2026', label: '2026 Reading Planner', emoji: '📖', filename: '2026-reading-planner.pdf', bucket: 'reading-assets' },
  { id: 'sticker-pack-cozy', label: 'Cozy Sticker Pack', emoji: '🌸', filename: 'cozy-sticker-pack.zip', bucket: 'reading-assets' },
  { id: 'sticker-pack-fantasy', label: 'Fantasy Sticker Pack', emoji: '✨', filename: 'fantasy-sticker-pack.zip', bucket: 'reading-assets' },
];

export default function AssetDownloads() {
  const [states, setStates] = useState({});

  const handleDownload = async (asset) => {
    setStates(s => ({ ...s, [asset.id]: { loading: true, error: null } }));

    const { data, error } = await supabase.storage
      .from(asset.bucket)
      .createSignedUrl(asset.filename, 60);

    if (error || !data?.signedUrl) {
      setStates(s => ({
        ...s,
        [asset.id]: { loading: false, error: 'Could not generate a download link. The file may not exist yet.' },
      }));
      return;
    }

    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = asset.filename;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setStates(s => ({ ...s, [asset.id]: { loading: false, error: null } }));
  };

  return (
    <section className="bg-cozy-card rounded-2xl border border-cozy-border p-6 shadow-sm animate-fade-in">
      <h2 className="font-serif text-xl text-cozy-text mb-1">Downloads</h2>
      <p className="text-cozy-muted text-sm mb-4">
        Secure links expire after 60 seconds — download immediately after clicking.
      </p>

      <ul className="space-y-3">
        {ASSETS.map(asset => {
          const state = states[asset.id] ?? {};
          return (
            <li
              key={asset.id}
              className="flex items-center justify-between gap-4 p-3 rounded-xl bg-cozy-bg border border-cozy-primary"
            >
              <span className="flex items-center gap-2 text-sm text-cozy-text font-medium">
                <span aria-hidden="true">{asset.emoji}</span>
                {asset.label}
              </span>

              <div className="flex flex-col items-end gap-1 min-w-[90px]">
                <button
                  onClick={() => handleDownload(asset)}
                  disabled={state.loading}
                  aria-label={`Download ${asset.label}`}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cozy-accent text-white font-medium hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.loading ? 'Getting link…' : 'Download'}
                </button>

                {state.error && (
                  <p role="alert" className="text-xs text-cozy-accent text-right">
                    {state.error}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
