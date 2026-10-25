import { useId } from 'react';
import { PAGE_W, PAGE_H } from './templates';

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

export function ShapeSvg({ item, exportId }) {
  const w = Math.max(1, item.w * PAGE_W);
  const h = Math.max(1, item.h * PAGE_H);
  const color = item.color || '#3b2f2f';
  const sw = 6;
  const pad = sw;
  const common = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinejoin: 'round', strokeLinecap: 'round' };
  let body;
  switch (item.shape) {
    case 'double':
      body = (
        <>
          <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} rx="6" {...common} />
          <rect x={pad * 3} y={pad * 3} width={w - pad * 6} height={h - pad * 6} rx="4" {...common} strokeWidth={sw / 2} />
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
    default:
      body = <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} rx="10" {...common} />;
  }
  return (
    <svg data-export={exportId} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="100%" className="block overflow-visible">
      {body}
    </svg>
  );
}
