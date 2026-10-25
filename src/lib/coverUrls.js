import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Covers live in the private `covers` bucket. Rows store `covers:<path>`;
// older rows may still hold the bucket's public URL. Both are resolved to
// short-lived signed URLs. Data URLs and other links are used as they are.

export const COVER_PREFIX = 'covers:';
const PUBLIC_MARKER = '/storage/v1/object/public/covers/';
const EXPIRY_SECONDS = 60 * 60;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

const cache = new Map(); // path -> { url, expiresAt }
const inflight = new Map(); // path -> Promise<string|null>
let queue = [];

export function coverPath(value) {
  if (!value) return null;
  if (value.startsWith(COVER_PREFIX)) return value.slice(COVER_PREFIX.length) || null;
  const at = value.indexOf(PUBLIC_MARKER);
  if (at === -1 || !value.startsWith('http')) return null;
  const path = value.slice(at + PUBLIC_MARKER.length).split(/[?#]/)[0];
  try {
    return decodeURIComponent(path) || null;
  } catch {
    return null;
  }
}

function cachedUrl(path) {
  const hit = cache.get(path);
  return hit && hit.expiresAt - REFRESH_MARGIN_MS > Date.now() ? hit.url : null;
}

async function flush() {
  const batch = queue;
  queue = [];
  let signed = new Map();
  try {
    const { data, error } = await supabase.storage
      .from('covers')
      .createSignedUrls(batch.map((b) => b.path), EXPIRY_SECONDS);
    if (!error) signed = new Map((data || []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl]));
  } catch {
    // leave every cover in this batch unresolved
  }
  const expiresAt = Date.now() + EXPIRY_SECONDS * 1000;
  for (const { path, resolve } of batch) {
    const url = signed.get(path) || null;
    if (url) cache.set(path, { url, expiresAt });
    inflight.delete(path);
    resolve(url);
  }
}

// Covers requested in the same tick are signed in one request.
function signCover(path) {
  if (!inflight.has(path)) {
    inflight.set(path, new Promise((resolve) => {
      if (queue.length === 0) setTimeout(flush, 0);
      queue.push({ path, resolve });
    }));
  }
  return inflight.get(path);
}

export function useCoverSrc(value) {
  const path = coverPath(value);
  const [signed, setSigned] = useState({ path: null, url: null });

  useEffect(() => {
    if (!path || cachedUrl(path)) return undefined;
    let live = true;
    signCover(path).then((url) => {
      if (live) setSigned({ path, url });
    });
    return () => {
      live = false;
    };
  }, [path]);

  if (!path) return value || '';
  return cachedUrl(path) || (signed.path === path ? signed.url : null);
}
