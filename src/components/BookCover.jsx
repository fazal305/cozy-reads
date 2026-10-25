import { useCoverSrc } from '../lib/coverUrls';

export default function BookCover({ book, className = '' }) {
  const src = useCoverSrc(book.cover_url);
  return (
    <div className={`relative overflow-hidden rounded-xl bg-cozy-bg border border-cozy-primary/40 shadow-sm ${className}`}>
      {src ? (
        <img src={src} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 text-center bg-gradient-to-br from-cozy-bg via-cozy-paper to-cozy-primary">
          <span className="text-xl" aria-hidden="true">📖</span>
          <span className="font-serif text-[11px] font-semibold text-cozy-text leading-tight line-clamp-3">
            {book.title}
          </span>
          {book.author && (
            <span className="text-[10px] text-cozy-muted truncate max-w-full">{book.author}</span>
          )}
        </div>
      )}
    </div>
  );
}
