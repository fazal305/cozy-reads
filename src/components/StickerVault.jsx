import { useState, useRef } from 'react';
import { STICKERS } from '../data/stickers';

const CATEGORIES = [
  { id: 'all', label: 'All Stickers' },
  { id: 'ratings', label: '★ Ratings & Badges' },
  { id: 'tropes', label: '⚔️ Book Tropes' },
  { id: 'cozy', label: '🌸 Cozy Doodles' },
];

export default function StickerVault() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef(null);

  const filteredStickers = activeCategory === 'all'
    ? STICKERS
    : STICKERS.filter(s => s.category === activeCategory);

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

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
              activeCategory === cat.id
                ? 'bg-cozy-accent text-white shadow-sm'
                : 'bg-cozy-bg text-cozy-text border border-cozy-primary hover:bg-cozy-paper'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sticker Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredStickers.map(sticker => {
          const isCopied = copiedId === sticker.id;
          return (
            <div
              key={sticker.id}
              className="group relative bg-cozy-bg border border-cozy-primary/40 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition hover:shadow-md hover:scale-[1.02] bg-gradient-to-b from-cozy-paper to-cozy-bg"
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
                  className="max-h-full max-w-full object-contain drop-shadow-sm select-none"
                  loading="lazy"
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
