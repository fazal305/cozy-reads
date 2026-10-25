import { today } from '../../lib/bookMeta';
import { parseDate } from './utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthCalendar({ month, label, renderDay }) {
  const first = parseDate(month);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const now = today();
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-[10px] sm:text-xs uppercase tracking-wide text-cozy-muted text-center">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </span>
        ))}
      </div>
      <ol aria-label={label} className="grid grid-cols-7 gap-1">
        {cells.map((date, i) =>
          date ? (
            <li
              key={date}
              className={`min-h-[3.75rem] sm:min-h-[5.5rem] rounded-lg border p-0.5 sm:p-1 flex flex-col min-w-0 ${
                date === now ? 'border-cozy-accent bg-cozy-paper' : 'border-cozy-primary/40 bg-cozy-paper/60'
              }`}
            >
              <span className={`text-[10px] sm:text-xs leading-none ${date === now ? 'text-cozy-accent font-semibold' : 'text-cozy-muted'}`}>
                <span className="sr-only">{parseDate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <span aria-hidden="true">{Number(date.slice(8))}</span>
              </span>
              <div className="flex-1 min-w-0 mt-0.5">{renderDay(date)}</div>
            </li>
          ) : (
            <li key={`pad-${i}`} aria-hidden="true" />
          )
        )}
      </ol>
    </div>
  );
}
