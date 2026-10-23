const TROPES = [
  // Romance
  'Enemies to Lovers',
  'Slow Burn',
  'Fake Dating',
  'Forced Proximity',
  'Second Chance',
  'Love Triangle',
  'Friends to Lovers',
  'Forbidden Love',
  'Grumpy / Sunshine',
  'Roommates',
  'Sports Romance',
  'Age Gap',
  // Fantasy / SFF
  'Chosen One',
  'Portal Fantasy',
  'Reluctant Hero',
  'Found Family',
  'Enemies to Allies',
  'Magic Academy',
  'Prophecy',
  'Dark Academia',
  'Antihero',
  'Fae Courts',
];

export default function TropeMatrix({ selected, onChange }) {
  const toggle = (trope) => {
    const next = selected.includes(trope)
      ? selected.filter(t => t !== trope)
      : [...selected, trope];
    onChange(next);
  };

  return (
    <section className="bg-cozy-card rounded-2xl border border-cozy-border p-6 shadow-sm animate-fade-in">
      <h2 className="font-serif text-xl text-cozy-text mb-1">Favourite Tropes</h2>
      <p className="text-cozy-muted text-sm mb-4">
        Tap to add or remove — saves automatically.
      </p>

      <div className="flex flex-wrap gap-2">
        {TROPES.map(trope => {
          const active = selected.includes(trope);
          return (
            <button
              key={trope}
              onClick={() => toggle(trope)}
              aria-pressed={active}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                active
                  ? 'bg-cozy-accent text-white border-cozy-accent shadow-sm'
                  : 'bg-cozy-bg text-cozy-text border-cozy-primary hover:border-cozy-accent hover:text-cozy-accent',
              ].join(' ')}
            >
              {trope}
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-cozy-muted text-sm mt-4 italic">None selected yet — pick your favourites.</p>
      )}
    </section>
  );
}
