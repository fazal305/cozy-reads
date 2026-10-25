import { useId } from 'react';
import { getCover } from './coverData';

const COW_SPOTS = [
  'M20 30 C40 5 85 15 80 45 C78 70 45 80 30 65 C15 55 5 45 20 30Z',
  'M150 10 C175 0 205 20 195 45 C185 65 155 60 145 45 C138 32 135 18 150 10Z',
  'M250 70 C280 50 320 70 310 105 C300 135 260 130 248 110 C240 95 238 80 250 70Z',
  'M90 120 C115 100 150 115 145 145 C140 175 100 180 88 160 C80 147 78 130 90 120Z',
  'M200 160 C220 150 245 165 238 185 C232 200 210 202 200 192 C192 182 190 168 200 160Z',
  'M330 10 C350 0 380 15 375 35 C370 55 345 55 335 45 C325 35 320 18 330 10Z',
  'M10 170 C30 160 50 175 45 195 L0 200 L0 180Z',
];

function Texture({ kind }) {
  const uid = useId().replace(/:/g, '');
  if (!kind) return null;
  if (kind === 'sheen') {
    return <div className="absolute inset-0" style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,.14) 45%, transparent 60%)' }} />;
  }
  return (
    <svg aria-hidden="true" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 200">
      <defs>
        {kind === 'grain' && (
          <filter id={`f${uid}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          </filter>
        )}
        {kind === 'croc' && (
          <pattern id={`p${uid}`} width="36" height="28" patternUnits="userSpaceOnUse">
            <rect x="2" y="2" width="15" height="11" rx="5" fill="rgba(255,255,255,.12)" stroke="rgba(0,0,0,.22)" strokeWidth="1.2" />
            <rect x="19" y="2" width="15" height="11" rx="5" fill="rgba(0,0,0,.06)" stroke="rgba(0,0,0,.22)" strokeWidth="1.2" />
            <rect x="-7" y="15" width="16" height="11" rx="5" fill="rgba(0,0,0,.06)" stroke="rgba(0,0,0,.22)" strokeWidth="1.2" />
            <rect x="11" y="15" width="14" height="11" rx="5" fill="rgba(255,255,255,.12)" stroke="rgba(0,0,0,.22)" strokeWidth="1.2" />
            <rect x="27" y="15" width="16" height="11" rx="5" fill="rgba(0,0,0,.06)" stroke="rgba(0,0,0,.22)" strokeWidth="1.2" />
          </pattern>
        )}
        {kind === 'floral' && (
          <pattern id={`p${uid}`} width="60" height="60" patternUnits="userSpaceOnUse">
            {[[15, 15, '#e88a8a'], [45, 45, '#d9a441']].map(([cx, cy, c]) => (
              <g key={cx}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse key={a} cx={cx} cy={cy - 6} rx="4" ry="6.5" fill={c} fillOpacity=".75" transform={`rotate(${a} ${cx} ${cy})`} />
                ))}
                <circle cx={cx} cy={cy} r="3" fill="#fff6d8" />
              </g>
            ))}
            <path d="M40 12 q6 -4 10 2 q-6 4 -10 -2Z M10 44 q6 -4 10 2 q-6 4 -10 -2Z" fill="#6a8d6c" fillOpacity=".7" />
          </pattern>
        )}
      </defs>
      {kind === 'grain' && <rect width="400" height="200" filter={`url(#f${uid})`} />}
      {(kind === 'croc' || kind === 'floral') && <rect width="400" height="200" fill={`url(#p${uid})`} />}
      {kind === 'cow' && COW_SPOTS.map((d) => <path key={d} d={d} fill="#2b2523" />)}
      {kind === 'marble' && (
        <g fill="none" strokeLinecap="round">
          <path d="M-10 40 C60 60 90 20 160 55 S260 120 410 90" stroke="#b9b3ae" strokeWidth="1.6" />
          <path d="M-10 140 C70 110 120 170 200 140 S320 60 410 150" stroke="#c9c3be" strokeWidth="1.1" />
          <path d="M120 -10 C140 50 110 90 150 130 S170 190 160 210" stroke="#d2b98a" strokeWidth="1.2" />
          <path d="M280 -10 C300 40 260 80 300 110" stroke="#cfc9c4" strokeWidth=".9" />
        </g>
      )}
    </svg>
  );
}

// Decorative notebook front. `compact` renders a small swatch for the picker.
export function NotebookCover({ coverId, title, name, compact = false }) {
  const cover = getCover(coverId);
  return (
    <div
      className={`relative overflow-hidden ${compact ? 'rounded-xl aspect-[4/3]' : 'rounded-2xl min-h-[11rem] sm:min-h-[13rem]'} shadow-md ring-1 ring-black/10 dark:ring-white/10`}
      style={{ background: cover.base }}
    >
      <Texture kind={cover.texture} />
      <div className="absolute inset-y-0 left-0 w-3 sm:w-4 bg-gradient-to-r from-black/30 to-transparent" />
      <div
        className={`absolute ${compact ? 'inset-1.5 rounded-lg border' : 'inset-3 rounded-xl border-2'} border-dashed pointer-events-none`}
        style={{ borderColor: cover.stitch, opacity: 0.8 }}
      />
      <div
        aria-hidden="true"
        className={`absolute top-0 ${compact ? 'right-3 w-2 h-[62%]' : 'right-8 w-5 sm:w-6 h-[72%]'} shadow`}
        style={{ background: cover.ribbon, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%)' }}
      />
      {!compact && (
        <div className="relative h-full min-h-[inherit] flex items-center justify-center p-6 sm:p-8">
          <div className="max-w-[80%] rounded-xl bg-[#fbf6ee]/95 px-5 py-3 text-center shadow-sm ring-1 ring-black/10">
            <p className="font-serif text-lg sm:text-2xl text-[#4a3535] leading-tight break-words">{title || 'My Reading Journal'}</p>
            {name && <p className="mt-1 text-xs sm:text-sm tracking-[0.2em] uppercase text-[#9b7272] break-words">{name}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
