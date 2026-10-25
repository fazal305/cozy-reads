import { useState } from 'react';
import { input, softButton } from '../../lib/ui';
import { isHttpsUrl, shiftMonth } from './utils';

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-xs text-cozy-accent-ink bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">
      {error}
    </p>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-cozy-muted italic text-center py-6">{children}</p>;
}

export function Field({ label, id, className = '', children }) {
  return (
    <div className={`space-y-1 min-w-0 ${className}`}>
      <label htmlFor={id} className="block text-xs font-medium text-cozy-text">{label}</label>
      {children}
    </div>
  );
}

export function Heading({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <h3 className="font-serif text-lg text-cozy-text">{title}</h3>
        {subtitle && <p className="text-cozy-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ className = '', children }) {
  return <div className={`rounded-2xl bg-cozy-bg border border-cozy-primary/60 p-4 min-w-0 ${className}`}>{children}</div>;
}

export function MonthPicker({ id, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(shiftMonth(value, -1))} aria-label="Previous month" className={`${softButton} px-2.5`}>‹</button>
      <label htmlFor={id} className="sr-only">Month</label>
      <input id={id} type="month" className={`${input} w-auto min-w-0`} value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />
      <button type="button" onClick={() => onChange(shiftMonth(value, 1))} aria-label="Next month" className={`${softButton} px-2.5`}>›</button>
    </div>
  );
}

export function BookSelect({ id, books, value, onChange, placeholder = 'No book' }) {
  return (
    <select id={id} className={input} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
    </select>
  );
}

export function DeleteButton({ label, onConfirm, className = '' }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} aria-label={label} className={`${softButton} px-2 ${className}`}>
        ✕
      </button>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <button type="button" onClick={onConfirm} className="px-2 py-1.5 rounded-xl text-xs font-medium bg-cozy-accent-strong text-white">Delete</button>
      <button type="button" onClick={() => setAsking(false)} className={`${softButton} px-2`}>Keep</button>
    </span>
  );
}

export function SafeLink({ href, children }) {
  if (!isHttpsUrl(href)) return <span className="break-all">{href}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-cozy-accent-ink hover:underline break-all">
      {children || href}
    </a>
  );
}
