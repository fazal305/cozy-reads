// Tap a level to set it, tap the same level again to clear it.
export default function RatingInput({ value, onChange, max = 5, icon, emptyIcon, label, allowZero = false, className = '' }) {
  const current = value ?? 0;
  const pick = (n) => {
    if (n === current) onChange(allowZero ? 0 : null);
    else onChange(n);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} role="group" aria-label={label}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => pick(n)}
          aria-label={`${label}: ${n} of ${max}`}
          aria-pressed={n <= current}
          className={`text-xl leading-none hover:scale-125 active:scale-95 transition ${n <= current ? '' : 'opacity-35 grayscale'}`}
        >
          {n <= current ? icon : emptyIcon ?? icon}
        </button>
      ))}
      <span className="text-xs text-cozy-muted font-medium ml-1.5">
        {current ? `${current} / ${max}` : 'None'}
      </span>
    </div>
  );
}
