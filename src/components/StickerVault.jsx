import { useState, useRef } from 'react';
import { STICKERS, STICKER_CATEGORIES } from '../data/stickers';

const CATEGORIES = [{ id: 'all', label: 'All' }, ...STICKER_CATEGORIES];
const CATEGORY_LABELS = Object.fromEntries(STICKER_CATEGORIES.map((c) => [c.id, c.label]));

export default function StickerVault() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef(null);

  const q = query.trim().toLowerCase();
  const filteredStickers = STICKERS.filter(
    (s) =>
      (activeCategory === 'all' || s.category === activeCategory) &&
      (!q || `${s.name} ${CATEGORY_LABELS[s.category] || ''}`.toLowerCase().includes(q)),
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCopySticker = async (sticker) => {
    try {
      const response = await fetch(sticker.src);
      const blob = await response.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedId(sticker.id);
        setTimeout(() => setCopiedId(null), 2000);
        showToast(`Copied "${sticker.name}" to clipboard! Paste directly into GoodNotes or your journal.`);
      } else {
        // Fallback for browsers that don't support image clipboard
        handleDownloadSticker(sticker);
      }
    } catch {
      handleDownloadSticker(sticker);
    }
  };

  const handleDownloadSticker = (sticker) => {
    const link = document.createElement('a');
    link.href = sticker.src;
    link.download = sticker.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Saved "${sticker.name}" to your device!`);
  };

  return (
    <section className="bg-cozy-card rounded-2xl border border-cozy-border p-6 shadow-sm animate-fade-in font-sans">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <h2 className="font-serif text-xl text-cozy-text flex items-center gap-2">
            <span aria-hidden="true">✨</span> Digital Sticker Vault
          </h2>
          <p className="text-cozy-muted text-sm mt-1">
            Tap any sticker to copy it directly to your clipboard or save it for your reading planner.
          </p>
        </div>
      </div>

      <input
        type="search"
        aria-label="Search stickers"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stickers…"
        className="w-full mb-3 px-3 py-2 rounded-xl border border-cozy-primary/60 bg-cozy-paper text-cozy-text placeholder-cozy-muted text-sm focus:outline-none focus:ring-2 focus:ring-cozy-accent"
      />

      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Sticker categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeCategory === cat.id
                ? 'bg-cozy-accent text-white shadow-sm'
                : 'bg-cozy-bg text-cozy-text border border-cozy-primary hover:bg-cozy-paper'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-cozy-muted mb-4" aria-live="polite">
        {filteredStickers.length} {filteredStickers.length === 1 ? 'sticker' : 'stickers'}
      </p>

      {filteredStickers.length === 0 && (
        <p className="text-sm text-cozy-muted italic text-center py-10">No stickers match your search.</p>
      )}

      {/* Sticker Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {filteredStickers.map(sticker => {
          const isCopied = copiedId === sticker.id;
          return (
            <div
              key={sticker.id}
              className="group relative min-w-0 bg-cozy-bg border border-cozy-primary/40 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-between text-center transition hover:shadow-md hover:scale-[1.02] bg-gradient-to-b from-cozy-paper to-cozy-bg"
            >
              {/* Sticker Graphic */}
              <div
                onClick={() => handleCopySticker(sticker)}
                className="w-full aspect-square flex items-center justify-center p-2 cursor-pointer transition active:scale-95"
                title="Click to copy sticker"
              >
                <img
                  src={sticker.src}
                  alt={sticker.name}
                  width="512"
                  height="512"
                  className="w-full h-full object-contain drop-shadow-sm select-none"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Title & Actions */}
              <div className="w-full mt-2 pt-2 border-t border-cozy-primary/30">
                <p className="font-serif text-xs font-semibold text-cozy-text truncate mb-2">
                  {sticker.name}
                </p>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleCopySticker(sticker)}
                    aria-label={`Copy ${sticker.name}`}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1 ${
                      isCopied
                        ? 'bg-[#408458] text-white'
                        : 'bg-cozy-paper border border-cozy-primary text-cozy-text hover:bg-cozy-accent hover:text-white hover:border-cozy-accent'
                    }`}
                  >
                    <span>{isCopied ? '✓' : '📋'}</span>
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSticker(sticker)}
                    aria-label={`Download ${sticker.name}`}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cozy-paper border border-cozy-primary text-cozy-text hover:bg-cozy-accent hover:text-white hover:border-cozy-accent transition"
                    title="Download PNG"
                  >
                    ⬇
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div role="status" className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 bg-cozy-paper border border-cozy-primary shadow-lg rounded-2xl px-5 py-3 text-sm text-cozy-text flex items-center gap-3 animate-fade-in max-w-sm">
          <span className="text-cozy-accent text-lg">🌸</span>
          <span className="text-xs leading-snug">{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
