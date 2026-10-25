import { useState } from 'react';
import { useEntries } from '../../hooks/useEntries';
import { currentMonth, today } from '../../lib/bookMeta';
import { input, primaryButton, softButton } from '../../lib/ui';
import { DeleteButton, ErrorNote, Field, Heading, MonthPicker, Panel } from './shared';
import { CURRENCIES, countdown, dateLabel, formatMoney, monthLabel, uid, useRunner, useSettings } from './utils';

const PURCHASE_CATEGORIES = ['Books', 'Special editions', 'E-books & audio', 'Merch', 'Subscriptions', 'Events', 'Other'];

function Meter({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      className="h-3 rounded-full bg-cozy-primary/30 overflow-hidden"
    >
      <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500 dark:bg-red-400' : 'bg-cozy-accent'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MonthlyBudget({ currency, run }) {
  const budgets = useEntries('extras.budget');
  const purchases = useEntries('extras.purchase');
  const [month, setMonth] = useState(currentMonth);
  const [amount, setAmount] = useState('');
  const [item, setItem] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState(PURCHASE_CATEGORIES[0]);
  const [date, setDate] = useState(today);
  const money = (v) => formatMoney(v, currency);

  const own = budgets.entries.find((e) => e.data?.month === month);
  const carried = own || [...budgets.entries].filter((e) => e.data?.month < month).sort((a, b) => b.data.month.localeCompare(a.data.month))[0];
  const budget = Number(carried?.data?.amount) || 0;
  const list = purchases.entries
    .filter((e) => String(e.entry_date || '').startsWith(month))
    .sort((a, b) => String(b.entry_date).localeCompare(String(a.entry_date)));
  const spent = list.reduce((sum, e) => sum + (Number(e.data?.amount) || 0), 0);
  const remaining = budget - spent;
  const byCategory = PURCHASE_CATEGORIES.map((c) => ({
    c,
    total: list.filter((e) => e.data?.category === c).reduce((sum, e) => sum + (Number(e.data?.amount) || 0), 0),
  })).filter((x) => x.total > 0);

  const changeMonth = (next) => {
    setMonth(next);
    setDate(next === currentMonth() ? today() : `${next}-01`);
  };

  const saveBudget = async (e) => {
    e.preventDefault();
    const data = { month, amount: Number(amount) };
    const result = await run(own ? budgets.update(own.id, { data: { ...own.data, ...data } }) : budgets.add({ data, entry_date: `${month}-01` }));
    if (!result?.error) setAmount('');
  };

  const addPurchase = async (e) => {
    e.preventDefault();
    const result = await run(purchases.add({ data: { item: item.trim(), amount: Number(cost), category }, entry_date: date }));
    if (!result?.error) {
      setItem('');
      setCost('');
    }
  };

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="font-serif text-base text-cozy-text">Monthly budget</h4>
        <MonthPicker id="budget-month" value={month} onChange={changeMonth} />
      </div>
      <ErrorNote error={budgets.error || purchases.error} />

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Budget', money(budget)],
          ['Spent', money(spent)],
          [remaining < 0 ? 'Over by' : 'Left', money(Math.abs(remaining))],
        ].map(([label, value]) => (
          <div key={label} className="bg-cozy-paper rounded-xl border border-cozy-primary/60 p-2 sm:p-3 min-w-0">
            <p className={`font-serif text-sm sm:text-lg truncate ${label === 'Over by' ? 'text-red-600 dark:text-red-400' : 'text-cozy-text'}`}>{value}</p>
            <p className="text-[11px] uppercase tracking-wide text-cozy-muted">{label}</p>
          </div>
        ))}
      </div>
      <Meter value={spent} max={budget} label={`Spent of ${monthLabel(month)} budget`} />
      {carried && !own && <p className="text-xs text-cozy-muted">Using your {monthLabel(carried.data.month)} budget. Set one for this month to change it.</p>}

      <form onSubmit={saveBudget} className="flex items-end gap-2 max-w-sm">
        <Field label={`Budget for ${monthLabel(month)}`} id="budget-amount" className="flex-1">
          <input id="budget-amount" type="number" min="0" step="0.01" className={input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={budget ? String(budget) : '5000'} />
        </Field>
        <button type="submit" disabled={amount === ''} className={`${softButton} py-2`}>Set</button>
      </form>

      <form onSubmit={addPurchase} className="grid gap-2 grid-cols-2 sm:grid-cols-6 sm:items-end">
        <Field label="Date" id="purchase-date" className="sm:col-span-2">
          <input id="purchase-date" type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Item" id="purchase-item" className="sm:col-span-4">
          <input id="purchase-item" className={input} value={item} onChange={(e) => setItem(e.target.value)} placeholder="Signed hardback" required />
        </Field>
        <Field label={`Amount (${currency})`} id="purchase-amount" className="sm:col-span-2">
          <input id="purchase-amount" type="number" min="0" step="0.01" className={input} value={cost} onChange={(e) => setCost(e.target.value)} required />
        </Field>
        <Field label="Category" id="purchase-category" className="sm:col-span-2">
          <select id="purchase-category" className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {PURCHASE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <button type="submit" disabled={!item.trim() || cost === '' || !date} className={`${primaryButton} col-span-2 sm:col-span-2`}>+ Purchase</button>
      </form>

      {byCategory.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Spending by category">
          {byCategory.map(({ c, total }) => (
            <li key={c} className="text-xs px-2 py-1 rounded-full bg-cozy-paper border border-cozy-primary/60 text-cozy-text">
              {c} <span className="text-cozy-muted">{money(total)}</span>
            </li>
          ))}
        </ul>
      )}

      {list.length ? (
        <ul className="divide-y divide-cozy-primary/40">
          {list.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="text-sm text-cozy-text truncate">{p.data.item}</p>
                <p className="text-[11px] text-cozy-muted">{dateLabel(p.entry_date)} · {p.data.category}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-cozy-text">{money(p.data.amount)}</span>
                <DeleteButton label={`Delete purchase ${p.data.item}`} onConfirm={() => run(purchases.remove(p.id))} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cozy-muted italic">No purchases logged for {monthLabel(month)}.</p>
      )}
    </Panel>
  );
}

function Subscriptions({ currency, run }) {
  const subs = useEntries('extras.subscription');
  const [service, setService] = useState('');
  const [cost, setCost] = useState('');
  const [renewal, setRenewal] = useState('');
  const money = (v) => formatMoney(v, currency);
  const list = [...subs.entries].sort((a, b) => String(a.data.renewal_date || '9').localeCompare(String(b.data.renewal_date || '9')));
  const total = list.reduce((sum, e) => sum + (Number(e.data?.cost) || 0), 0);

  const add = async (e) => {
    e.preventDefault();
    const result = await run(subs.add({ data: { service: service.trim(), cost: Number(cost), renewal_date: renewal, books_received: 0 }, entry_date: renewal || null }));
    if (!result?.error) {
      setService('');
      setCost('');
      setRenewal('');
    }
  };

  return (
    <Panel className="space-y-4">
      <Heading title="Subscriptions" subtitle={list.length ? `${money(total)} per cycle` : undefined} />
      <ErrorNote error={subs.error} />
      <form onSubmit={add} className="grid gap-2 grid-cols-2 sm:grid-cols-6 sm:items-end">
        <Field label="Service" id="sub-service" className="col-span-2 sm:col-span-6">
          <input id="sub-service" className={input} value={service} onChange={(e) => setService(e.target.value)} placeholder="Book box, audiobook app…" required />
        </Field>
        <Field label={`Cost (${currency})`} id="sub-cost" className="sm:col-span-2">
          <input id="sub-cost" type="number" min="0" step="0.01" className={input} value={cost} onChange={(e) => setCost(e.target.value)} required />
        </Field>
        <Field label="Renews" id="sub-renewal" className="sm:col-span-2">
          <input id="sub-renewal" type="date" className={input} value={renewal} onChange={(e) => setRenewal(e.target.value)} />
        </Field>
        <button type="submit" disabled={!service.trim() || cost === ''} className={`${primaryButton} col-span-2 sm:col-span-2`}>+ Subscription</button>
      </form>
      {list.length ? (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-cozy-paper border border-cozy-primary/60 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm text-cozy-text font-medium break-words">{s.data.service}</p>
                <p className="text-[11px] text-cozy-muted">
                  {money(s.data.cost)}
                  {s.data.renewal_date && <> · renews {dateLabel(s.data.renewal_date)} <span className="text-cozy-accent">({countdown(s.data.renewal_date)})</span></>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-cozy-text" aria-live="polite">📦 {Number(s.data.books_received) || 0} {Number(s.data.books_received) === 1 ? 'book' : 'books'}</span>
                <button
                  type="button"
                  onClick={() => run(subs.update(s.id, { data: { ...s.data, books_received: (Number(s.data.books_received) || 0) + 1 } }))}
                  aria-label={`Log a book received from ${s.data.service}`}
                  className={`${softButton} px-2`}
                >
                  +1
                </button>
                <DeleteButton label={`Delete subscription ${s.data.service}`} onConfirm={() => run(subs.remove(s.id))} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cozy-muted italic">No subscriptions yet.</p>
      )}
    </Panel>
  );
}

function SavingsGoal({ goal, currency, onSave, onRemove }) {
  const [amount, setAmount] = useState('');
  const contributions = goal.data.contributions || [];
  const saved = contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const target = Number(goal.data.target) || 0;
  const money = (v) => formatMoney(v, currency);

  const contribute = async (e) => {
    e.preventDefault();
    const result = await onSave([...contributions, { id: uid(), date: today(), amount: Number(amount) }]);
    if (!result?.error) setAmount('');
  };

  return (
    <li className="p-3 rounded-xl bg-cozy-paper border border-cozy-primary/60 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-cozy-text font-medium break-words">{goal.data.name}</p>
          <p className="text-[11px] text-cozy-muted">
            {money(saved)} of {money(target)}
            {saved >= target && target > 0 ? ' · Goal reached 🎉' : ` · ${money(Math.max(0, target - saved))} to go`}
          </p>
        </div>
        <DeleteButton label={`Delete savings goal ${goal.data.name}`} onConfirm={onRemove} />
      </div>
      <Meter value={saved} max={target} label={`Saved towards ${goal.data.name}`} />
      <form onSubmit={contribute} className="flex gap-2">
        <label htmlFor={`save-${goal.id}`} className="sr-only">Contribution to {goal.data.name}</label>
        <input id={`save-${goal.id}`} type="number" min="0" step="0.01" className={input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Add ${currency}`} />
        <button type="submit" disabled={amount === '' || Number(amount) <= 0} className={`${softButton} shrink-0`}>Save</button>
      </form>
      {contributions.length > 0 && (
        <ul className="text-[11px] text-cozy-muted flex flex-wrap gap-x-3 gap-y-1">
          {contributions.slice(-6).reverse().map((c) => (
            <li key={c.id} className="inline-flex items-center gap-1">
              {dateLabel(c.date)}: {money(c.amount)}
              <button type="button" onClick={() => onSave(contributions.filter((x) => x.id !== c.id))} aria-label={`Remove contribution from ${dateLabel(c.date)}`} className="hover:text-cozy-accent">✕</button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Savings({ currency, run }) {
  const goals = useEntries('extras.savings');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  const add = async (e) => {
    e.preventDefault();
    const result = await run(goals.add({ data: { name: name.trim(), target: Number(target), contributions: [] } }));
    if (!result?.error) {
      setName('');
      setTarget('');
    }
  };

  return (
    <Panel className="space-y-4">
      <Heading title="Special edition savings" />
      <ErrorNote error={goals.error} />
      <form onSubmit={add} className="grid gap-2 grid-cols-2 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <Field label="Saving for" id="savings-name" className="col-span-2 sm:col-span-1">
          <input id="savings-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprayed-edge box set" required />
        </Field>
        <Field label={`Target (${currency})`} id="savings-target">
          <input id="savings-target" type="number" min="1" step="0.01" className={input} value={target} onChange={(e) => setTarget(e.target.value)} required />
        </Field>
        <button type="submit" disabled={!name.trim() || !(Number(target) > 0)} className={primaryButton}>+ Goal</button>
      </form>
      {goals.entries.length ? (
        <ul className="space-y-2">
          {goals.entries.map((g) => (
            <SavingsGoal
              key={g.id}
              goal={g}
              currency={currency}
              onSave={(contributions) => run(goals.update(g.id, { data: { ...g.data, contributions } }))}
              onRemove={() => run(goals.remove(g.id))}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cozy-muted italic">No savings goals yet.</p>
      )}
    </Panel>
  );
}

export default function Budget() {
  const { settings, save } = useSettings();
  const { error, run } = useRunner();
  const currency = settings.currency || 'PKR';

  return (
    <div className="space-y-5">
      <Heading title="Bookish budget" subtitle="Track spending, subscriptions and savings">
        <div className="flex items-center gap-2">
          <label htmlFor="budget-currency" className="text-xs font-medium text-cozy-text">Currency</label>
          <select id="budget-currency" className={`${input} w-auto`} value={currency} onChange={(e) => run(save({ currency: e.target.value }))}>
            {[...new Set([currency, ...CURRENCIES])].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Heading>
      <ErrorNote error={error} />
      <MonthlyBudget currency={currency} run={run} />
      <Subscriptions currency={currency} run={run} />
      <Savings currency={currency} run={run} />
    </div>
  );
}
