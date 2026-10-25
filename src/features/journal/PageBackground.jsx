import { useId, forwardRef } from 'react';
import { PAGE_W, PAGE_H, getPaper } from './templates';

const SERIF = '"Playfair Display", Georgia, serif';
const SANS = '"DM Sans", Arial, sans-serif';

function Label({ x, y, children, paper, size = 26, anchor }) {
  return (
    <text x={x} y={y} fill={paper.accent} fontFamily={SANS} fontSize={size} fontWeight="600" letterSpacing="2.5" textAnchor={anchor}>
      {String(children).toUpperCase()}
    </text>
  );
}

function Title({ children, paper, y = 120 }) {
  return (
    <>
      <text x={PAGE_W / 2} y={y} fill={paper.ink} fontFamily={SERIF} fontSize="64" fontStyle="italic" textAnchor="middle">{children}</text>
      <path d={`M${PAGE_W / 2 - 90} ${y + 28} Q${PAGE_W / 2} ${y + 44} ${PAGE_W / 2 + 90} ${y + 28}`} stroke={paper.accent} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  );
}

function Lines({ x1, x2, y, count, gap = 56, paper }) {
  return Array.from({ length: count }, (_, i) => (
    <line key={i} x1={x1} x2={x2} y1={y + i * gap} y2={y + i * gap} stroke={paper.line} strokeWidth="2.5" />
  ));
}

function Star({ cx, cy, r, paper }) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `;
  }
  return <path d={`${d}Z`} fill="none" stroke={paper.accent} strokeWidth="3" strokeLinejoin="round" />;
}

function Flame({ cx, cy, s, paper }) {
  return (
    <path
      d={`M${cx} ${cy - s} C${cx + s * 0.9} ${cy - s * 0.2} ${cx + s * 0.7} ${cy + s} ${cx} ${cy + s} C${cx - s * 0.7} ${cy + s} ${cx - s * 0.9} ${cy - s * 0.1} ${cx - s * 0.2} ${cy - s * 0.45} C${cx - s * 0.1} ${cy - s * 0.1} ${cx + s * 0.15} ${cy - s * 0.2} ${cx} ${cy - s} Z`}
      fill="none"
      stroke={paper.accent}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  );
}

function Box({ x, y, w, h, paper, dashed }) {
  return <rect x={x} y={y} width={w} height={h} rx="18" fill="none" stroke={paper.line} strokeWidth="3" strokeDasharray={dashed ? '10 10' : undefined} />;
}

function Review({ paper }) {
  return (
    <>
      <Title paper={paper}>Book Review</Title>
      <Label x={80} y={250} paper={paper}>Title</Label>
      <Lines x1={210} x2={920} y={252} count={1} paper={paper} />
      <Label x={80} y={330} paper={paper}>Author</Label>
      <Lines x1={230} x2={920} y={332} count={1} paper={paper} />
      <Label x={80} y={420} paper={paper}>Stars</Label>
      {[0, 1, 2, 3, 4].map((i) => <Star key={i} cx={250 + i * 62} cy={410} r={24} paper={paper} />)}
      <Label x={580} y={420} paper={paper}>Spice</Label>
      {[0, 1, 2, 3, 4].map((i) => <Flame key={i} cx={720 + i * 48} cy={410} s={20} paper={paper} />)}
      <Label x={80} y={510} paper={paper}>Favourite quote</Label>
      <Box x={80} y={530} w={840} h={230} paper={paper} />
      <text x={110} y={610} fill={paper.line} fontFamily={SERIF} fontSize="90">“</text>
      <text x={890} y={745} fill={paper.line} fontFamily={SERIF} fontSize="90" textAnchor="end">”</text>
      <Label x={80} y={830} paper={paper}>Thoughts</Label>
      <Lines x1={80} x2={920} y={900} count={8} paper={paper} />
    </>
  );
}

function Monthly({ paper }) {
  return (
    <>
      <Title paper={paper}>Monthly Wrap-up</Title>
      <Label x={80} y={245} paper={paper}>Month</Label>
      <Lines x1={210} x2={540} y={247} count={1} paper={paper} />
      <Label x={80} y={330} paper={paper}>Books read</Label>
      {Array.from({ length: 8 }, (_, i) => (
        <Box key={i} x={80 + (i % 4) * 215} y={355 + Math.floor(i / 4) * 255} w={195} h={235} paper={paper} dashed />
      ))}
      {[
        ['Books', 80],
        ['Pages', 365],
        ['Star read', 650],
      ].map(([label, x]) => (
        <g key={label}>
          <Box x={x} y={900} w={270} h={140} paper={paper} />
          <Label x={x + 135} y={945} paper={paper} size={22} anchor="middle">{label}</Label>
        </g>
      ))}
      <Label x={80} y={1110} paper={paper}>Highlights</Label>
      <Lines x1={80} x2={560} y={1170} count={4} paper={paper} />
      <Label x={620} y={1110} paper={paper}>Next up</Label>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={620} y={1145 + i * 56} width="24" height="24" rx="6" fill="none" stroke={paper.accent} strokeWidth="3" />
          <line x1={660} x2={920} y1={1170 + i * 56} y2={1170 + i * 56} stroke={paper.line} strokeWidth="2.5" />
        </g>
      ))}
    </>
  );
}

function Current({ paper }) {
  return (
    <>
      <Title paper={paper}>Currently Reading</Title>
      <Box x={80} y={220} w={320} h={470} paper={paper} dashed />
      <text x={240} y={465} fill={paper.line} fontFamily={SANS} fontSize="26" letterSpacing="3" textAnchor="middle">COVER</text>
      {[
        ['Title', 260],
        ['Author', 360],
        ['Started', 460],
        ['Format', 560],
      ].map(([label, y]) => (
        <g key={label}>
          <Label x={440} y={y} paper={paper} size={22}>{label}</Label>
          <Lines x1={440} x2={920} y={y + 50} count={1} paper={paper} />
        </g>
      ))}
      <Label x={80} y={770} paper={paper}>Progress</Label>
      <rect x={80} y={795} width={840} height={40} rx="20" fill="none" stroke={paper.accent} strokeWidth="3" />
      {[0, 25, 50, 75, 100].map((p) => (
        <text key={p} x={80 + (840 * p) / 100} y={875} fill={paper.accent} fontFamily={SANS} fontSize="20" textAnchor={p === 0 ? 'start' : p === 100 ? 'end' : 'middle'}>{p}%</text>
      ))}
      <Label x={80} y={950} paper={paper}>Predictions & notes</Label>
      <Lines x1={80} x2={560} y={1010} count={6} paper={paper} />
      <Label x={620} y={950} paper={paper}>Best line so far</Label>
      <Box x={620} y={975} w={300} h={320} paper={paper} />
    </>
  );
}

function Ruling({ template, paper, pid }) {
  if (template === 'lined') {
    return (
      <>
        <Lines x1={0} x2={PAGE_W} y={170} count={22} gap={56} paper={paper} />
        <line x1={110} x2={110} y1={0} y2={PAGE_H} stroke={paper.accent} strokeOpacity="0.45" strokeWidth="2.5" />
      </>
    );
  }
  if (template === 'dotted' || template === 'grid') {
    return (
      <>
        <defs>
          <pattern id={pid} width="50" height="50" patternUnits="userSpaceOnUse" x="25" y="32">
            {template === 'dotted' ? (
              <circle cx="25" cy="25" r="3" fill={paper.line} />
            ) : (
              <path d="M50 0 L0 0 0 50" fill="none" stroke={paper.line} strokeWidth="2" />
            )}
          </pattern>
        </defs>
        <rect width={PAGE_W} height={PAGE_H} fill={`url(#${pid})`} />
      </>
    );
  }
  return null;
}

const PageBackground = forwardRef(function PageBackground({ template, paper: paperId, paperColor }, ref) {
  const pid = `ruling-${useId().replace(/:/g, '')}`;
  const paper = getPaper(paperId, paperColor);
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full select-none pointer-events-none"
    >
      <rect width={PAGE_W} height={PAGE_H} fill={paper.bg} />
      <Ruling template={template} paper={paper} pid={pid} />
      {template === 'review' && <Review paper={paper} />}
      {template === 'monthly' && <Monthly paper={paper} />}
      {template === 'current' && <Current paper={paper} />}
    </svg>
  );
});

export default PageBackground;
