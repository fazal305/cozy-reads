import { useId } from 'react';
import { PAGE_W, PAGE_H, round } from './templates';

function zigzag(w, h, edge) {
  const steps = Math.max(4, Math.round(h / 9));
  const step = h / steps;
  let left = `M${edge} 0`;
  for (let i = 1; i <= steps; i++) left += ` L${i % 2 ? 0 : edge} ${i * step}`;
  let right = ` L${w - edge} ${h}`;
  for (let i = steps - 1; i >= 0; i--) right += ` L${i % 2 ? w : w - edge} ${i * step}`;
  return `${left}${right} Z`;
}

export function WashiSvg({ item, exportId }) {
  const uid = useId().replace(/:/g, '');
  const w = Math.max(1, item.w * PAGE_W);
  const h = Math.max(1, item.h * PAGE_H);
  const color = item.color || '#f4b5b5';
  const pid = `washi-${uid}`;
  const s = Math.max(8, Math.min(h * 0.45, 26));
  const pattern = {
    stripes: <path d={`M0 ${s} L${s} 0 M${-s / 2} ${s / 2} L${s / 2} ${-s / 2} M${s / 2} ${s * 1.5} L${s * 1.5} ${s / 2}`} stroke="#ffffff" strokeWidth={s / 4} strokeOpacity="0.65" />,
    dots: <circle cx={s / 2} cy={s / 2} r={s / 6} fill="#ffffff" fillOpacity="0.8" />,
    gingham: (
      <>
        <rect width={s / 2} height={s} fill="#ffffff" fillOpacity="0.35" />
        <rect width={s} height={s / 2} fill="#ffffff" fillOpacity="0.35" />
      </>
    ),
    hearts: <path d={`M${s / 2} ${s * 0.78} C${s * 0.1} ${s * 0.5} ${s * 0.18} ${s * 0.18} ${s / 2} ${s * 0.38} C${s * 0.82} ${s * 0.18} ${s * 0.9} ${s * 0.5} ${s / 2} ${s * 0.78}Z`} fill="#ffffff" fillOpacity="0.75" />,
  }[item.style];

  return (
    <svg data-export={exportId} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="100%" className="block overflow-visible">
      {pattern && (
        <defs>
          <pattern id={pid} width={s} height={s} patternUnits="userSpaceOnUse">
            {pattern}
          </pattern>
        </defs>
      )}
      <path d={zigzag(w, h, Math.min(8, w / 10))} fill={color} fillOpacity="0.88" />
      {pattern && <path d={zigzag(w, h, Math.min(8, w / 10))} fill={`url(#${pid})`} />}
    </svg>
  );
}

function starPath(cx, cy, rx, ry) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const k = i % 2 ? 0.45 : 1;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${cx + rx * k * Math.cos(a)} ${cy + ry * k * Math.sin(a)} `;
  }
  return `${d}Z`;
}

// Draws a path written in 0..1 coordinates (M, L, C, Z only) into the inner box.
function unitPath(d, x0, y0, iw, ih) {
  let n = 0;
  return d.replace(/-?\d*\.?\d+/g, (num) => {
    const v = Number(num);
    return String(round(n++ % 2 ? y0 + v * ih : x0 + v * iw));
  });
}

const UNIT_PATHS = {
  cloud: 'M .24 .86 C .05 .86 .0 .56 .2 .5 C .14 .22 .46 .1 .56 .3 C .66 .08 .94 .2 .86 .5 C 1 .54 1 .86 .8 .86 Z',
  sparkle: 'M .5 0 C .5 .36 .64 .5 1 .5 C .64 .5 .5 .64 .5 1 C .5 .64 .36 .5 0 .5 C .36 .5 .5 .36 .5 0 Z',
  bookmark: 'M .12 0 L .88 0 L .88 1 L .5 .72 L .12 1 Z',
  tag: 'M 0 .5 L .2 0 L 1 0 L 1 1 L .2 1 Z',
  banner: 'M 0 .1 L 1 .1 L .92 .5 L 1 .9 L 0 .9 L .08 .5 Z',
  note: 'M 0 0 L 1 0 L 1 .76 L .76 1 L 0 1 Z',
  fold: 'M 1 .76 L .76 .76 L .76 1 Z',
};

export function ShapeSvg({ item, exportId }) {
  const w = Math.max(1, item.w * PAGE_W);
  const h = Math.max(1, item.h * PAGE_H);
  const color = item.color || '#3b2f2f';
  const sw = item.sw ?? 6;
  const pad = sw;
  const iw = Math.max(1, w - pad * 2);
  const ih = Math.max(1, h - pad * 2);
  const cy = h / 2;
  const filled = item.filled ?? item.shape === 'ribbon';
  const common = { fill: filled ? color : 'none', stroke: color, strokeWidth: sw, strokeLinejoin: 'round', strokeLinecap: 'round' };
  const stroked = { ...common, fill: 'none' };
  const rad = (fallback) => Math.max(0, Math.min(item.rad ?? fallback, iw / 2, ih / 2));
  const unit = (key) => unitPath(UNIT_PATHS[key], pad, pad, iw, ih);
  let body;
  switch (item.shape) {
    case 'double':
      body = (
        <>
          <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} rx={rad(6)} {...common} />
          <rect x={pad * 3} y={pad * 3} width={Math.max(1, w - pad * 6)} height={Math.max(1, h - pad * 6)} rx={rad(6) * 0.67} {...stroked} strokeWidth={sw / 2} />
        </>
      );
      break;
    case 'circle':
      body = <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - pad} ry={h / 2 - pad} {...common} />;
      break;
    case 'heart':
      body = (
        <path
          d={`M${w / 2} ${h - pad} C${w * 0.05} ${h * 0.62} ${pad} ${h * 0.28} ${w * 0.27} ${h * 0.12} C${w * 0.4} ${h * 0.05} ${w * 0.48} ${h * 0.14} ${w / 2} ${h * 0.24} C${w * 0.52} ${h * 0.14} ${w * 0.6} ${h * 0.05} ${w * 0.73} ${h * 0.12} C${w - pad} ${h * 0.28} ${w * 0.95} ${h * 0.62} ${w / 2} ${h - pad} Z`}
          {...common}
        />
      );
      break;
    case 'star':
      body = <path d={starPath(w / 2, h * 0.54, w / 2 - pad, h * 0.54 - pad)} {...common} />;
      break;
    case 'ribbon': {
      const t = h * 0.18;
      body = (
        <>
          <path d={`M${pad} ${t} L${w * 0.14} ${t} L${w * 0.14} ${h - pad} L${pad} ${h - pad} L${w * 0.06} ${(t + h - pad) / 2} Z`} fill={color} fillOpacity="0.55" />
          <path d={`M${w - pad} ${t} L${w * 0.86} ${t} L${w * 0.86} ${h - pad} L${w - pad} ${h - pad} L${w * 0.94} ${(t + h - pad) / 2} Z`} fill={color} fillOpacity="0.55" />
          <rect x={w * 0.1} y={pad} width={w * 0.8} height={h - t - pad} rx="4" fill={color} />
        </>
      );
      break;
    }
    case 'rect':
    case 'rounded':
      body = <rect x={pad} y={pad} width={iw} height={ih} rx={rad(item.shape === 'rect' ? 0 : 40)} {...common} />;
      break;
    case 'line':
      body = <line x1={pad} y1={cy} x2={w - pad} y2={cy} {...stroked} />;
      break;
    case 'arrow': {
      const head = Math.max(sw * 1.5, Math.min(ih / 2, iw / 2));
      body = (
        <>
          <line x1={pad} y1={cy} x2={w - pad} y2={cy} {...stroked} />
          <path d={`M${w - pad - head} ${cy - head} L${w - pad} ${cy} L${w - pad - head} ${cy + head}`} {...stroked} />
        </>
      );
      break;
    }
    case 'bubble': {
      const bottom = h - pad - ih * 0.22;
      const r = Math.min(rad(36), (bottom - pad) / 2);
      const x1 = w - pad;
      body = (
        <path
          d={`M${pad + r} ${pad} H${x1 - r} Q${x1} ${pad} ${x1} ${pad + r} V${bottom - r} Q${x1} ${bottom} ${x1 - r} ${bottom} H${w * 0.38} L${w * 0.16} ${h - pad} L${w * 0.22} ${bottom} H${pad + r} Q${pad} ${bottom} ${pad} ${bottom - r} V${pad + r} Q${pad} ${pad} ${pad + r} ${pad} Z`}
          {...common}
        />
      );
      break;
    }
    case 'thought': {
      const ry = (ih * 0.78) / 2;
      body = (
        <>
          <ellipse cx={w / 2} cy={pad + ry} rx={iw / 2} ry={ry} {...common} />
          <circle cx={w * 0.2} cy={h - pad - ih * 0.1} r={Math.max(2, ih * 0.065)} {...common} />
          <circle cx={w * 0.1} cy={h - pad - ih * 0.025} r={Math.max(2, ih * 0.035)} {...common} />
        </>
      );
      break;
    }
    case 'cloud':
      body = <path d={unit('cloud')} {...common} />;
      break;
    case 'flower': {
      const rx = iw / 2;
      const ry = ih / 2;
      body = (
        <>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            return <ellipse key={i} cx={w / 2 + Math.cos(a) * rx * 0.64} cy={cy + Math.sin(a) * ry * 0.64} rx={rx * 0.31} ry={ry * 0.31} {...common} />;
          })}
          <ellipse cx={w / 2} cy={cy} rx={rx * 0.2} ry={ry * 0.2} fill={filled ? '#ffffff' : 'none'} fillOpacity="0.85" stroke={color} strokeWidth={sw} />
        </>
      );
      break;
    }
    case 'sparkle':
      body = <path d={unit('sparkle')} {...common} />;
      break;
    case 'bookmark':
      body = <path d={unit('bookmark')} {...common} />;
      break;
    case 'tag':
      body = (
        <>
          <path d={unit('tag')} {...common} />
          <circle cx={pad + iw * 0.2} cy={cy} r={Math.max(2, Math.min(iw, ih) * 0.08)} fill={filled ? '#ffffff' : 'none'} fillOpacity="0.85" stroke={color} strokeWidth={sw / 2} />
        </>
      );
      break;
    case 'banner':
      body = <path d={unit('banner')} {...common} />;
      break;
    case 'note':
      body = (
        <>
          <path d={unit('note')} {...common} />
          <path d={unitPath(UNIT_PATHS.fold, pad, pad, iw, ih)} fill="#000000" fillOpacity={filled ? 0.18 : 0} stroke={color} strokeWidth={sw / 2} strokeLinejoin="round" />
        </>
      );
      break;
    case 'dotted':
      body = <line x1={pad} y1={cy} x2={w - pad} y2={cy} {...stroked} strokeDasharray={`0 ${sw * 2.4}`} />;
      break;
    case 'wavy': {
      const half = iw / Math.max(2, Math.round(iw / Math.max(sw * 7, 28)));
      const amp = Math.min(ih / 2, half * 0.4);
      let d = `M${pad} ${cy}`;
      for (let x = pad, k = 0; x < w - pad - 1; x += half, k++) d += ` Q${x + half / 2} ${cy + (k % 2 ? 2 : -2) * amp} ${x + half} ${cy}`;
      body = <path d={d} {...stroked} />;
      break;
    }
    case 'dline': {
      const gap = sw * 0.9 + 2;
      body = (
        <>
          <line x1={pad} y1={cy - gap} x2={w - pad} y2={cy - gap} {...stroked} strokeWidth={sw * 0.6} />
          <line x1={pad} y1={cy + gap} x2={w - pad} y2={cy + gap} {...stroked} strokeWidth={sw * 0.6} />
        </>
      );
      break;
    }
    default:
      body = <rect x={pad} y={pad} width={iw} height={ih} rx={rad(10)} {...common} />;
  }
  return (
    <svg data-export={exportId} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="100%" className="block overflow-visible">
      {body}
    </svg>
  );
}
