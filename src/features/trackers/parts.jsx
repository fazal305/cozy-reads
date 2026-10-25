export function SectionTitle({ icon, title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
      <div className="min-w-0">
        <h3 className="font-serif text-lg text-cozy-text flex items-center gap-2">
          <span aria-hidden="true">{icon}</span> {title}
        </h3>
        {subtitle && <p className="text-cozy-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-xs text-cozy-accent font-medium mb-3">
      {error}
    </p>
  );
}

export function Empty({ children }) {
  return (
    <p className="text-sm text-cozy-muted text-center py-8 px-4 rounded-2xl border border-dashed border-cozy-primary bg-cozy-bg/60">
      {children}
    </p>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-cozy-bg border border-cozy-border px-3 py-2 min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-cozy-muted leading-tight">{label}</p>
      <p className="font-serif text-lg text-cozy-text leading-tight truncate">{value}</p>
    </div>
  );
}

export function Switch({ checked, onChange, label, showLabel = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-xs font-medium text-cozy-text"
    >
      <span className={`w-9 h-5 rounded-full p-0.5 transition shrink-0 ${checked ? 'bg-cozy-accent' : 'bg-cozy-primary/60'}`}>
        <span className={`block w-4 h-4 rounded-full bg-white shadow transition ${checked ? 'translate-x-4' : ''}`} />
      </span>
      {showLabel && label}
    </button>
  );
}

export function Field({ label, htmlFor, className = '', children }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-cozy-text mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Stars({ value }) {
  if (!value) return <span className="text-xs text-cozy-muted">–</span>;
  return (
    <span className="text-cozy-accent text-xs whitespace-nowrap" role="img" aria-label={`${value} of 5 stars`}>
      {'★'.repeat(value)}
      <span className="opacity-30">{'★'.repeat(Math.max(0, 5 - value))}</span>
    </span>
  );
}

// rows: [{ key, label, value }]
export function BarList({ rows, unit = '' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-xs">
          <span className="text-cozy-text truncate" title={r.label}>{r.label}</span>
          <span className="h-3 rounded-full bg-cozy-bg border border-cozy-border overflow-hidden" aria-hidden="true">
            <span className="block h-full rounded-full bg-cozy-accent" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="text-right text-cozy-muted tabular-nums">
            {r.value}
            <span className="sr-only"> {unit}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
