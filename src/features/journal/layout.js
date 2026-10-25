import { fontCss } from './templates';

export function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

// Photos keep a bucket path in `src`; older images hold an https link in `url`.
export function imageValue(item) {
  if (item.src) return /^(covers:|data:image\/|https:)/.test(item.src) ? item.src : '';
  return isHttpsUrl(item.url) ? item.url : '';
}

export function boxStyle(item) {
  return {
    opacity: item.op != null && item.op < 1 ? item.op : undefined,
    left: `${item.x * 100}%`,
    top: `${item.y * 100}%`,
    width: `${item.w * 100}%`,
    height: item.type === 'text' ? undefined : `${item.h * 100}%`,
    transform: item.r ? `rotate(${item.r}deg)` : undefined,
  };
}

export function textStyle(item) {
  return {
    fontFamily: fontCss(item.font),
    fontSize: `${item.size * 100}cqw`,
    color: item.color,
    lineHeight: 1.25,
    padding: '0.1em 0.15em',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  };
}
