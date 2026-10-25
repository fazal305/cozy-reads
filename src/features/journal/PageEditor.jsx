import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { input, pill, primaryButton, softButton } from '../../lib/ui';
import { useJournal } from '../../lib/journalContext';
import { ColorSwatches } from '../../components/ColorPicker';
import { Modal } from '../challenges/shared';
import PageCanvas from './PageCanvas';
import PageBackground from './PageBackground';
import StickerDrawer, { DecorPreview } from './StickerDrawer';
import { addPoint, endPoint, eraseAlong, eraseAt, finishStroke, strokeGeometry, strokeStyle } from './ink';
import { cascadeSpot, decorItem, duplicateItem, imageItem, pageDoc, textItem } from './items';
import { boxStyle, isHttpsUrl, textStyle } from './layout';
import { exportPagePng } from './exportPng';
import { preparePhoto, PhotoError } from './photo';
import { resizeCells, withHeight, CHECK, TABLE } from './elements';
import {
  PAGE_RATIO, PAPERS, TEMPLATES, INK_COLORS, HIGHLIGHT_COLORS, DECOR_COLORS, PEN_SIZES, HIGHLIGHTER_SIZES, ERASER_SIZES,
  FONTS, TEXT_SIZES, WASHI_STYLES, getPaper, newItemId, round, shapeCanFill, shapeHasRadius,
} from './templates';

const ELEMENT_COLORS = ['#e3a82b', '#d9483b', '#e88a8a', '#4f7a63', '#355070', '#6d597a'];

const HISTORY_LIMIT = 100;

// Empty text boxes are not stored, except the one still being typed into.
function cleanDoc(doc, keepId) {
  const items = doc.items.filter((i) => i.type !== 'text' || i.id === keepId || i.text.trim());
  return items.length === doc.items.length ? doc : { ...doc, items };
}

function useHistory(initial) {
  const [hist, setHist] = useState({ past: [], present: initial, future: [], gid: null });

  // gid groups a gesture (drag, typing, erasing) into one undo step.
  const change = useCallback((fn, gid = null) => {
    setHist((h) => {
      const next = fn(h.present);
      if (next === h.present) return h;
      if (gid && h.gid === gid) return { ...h, present: next };
      return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [], gid };
    });
  }, []);
  const undo = useCallback(() => {
    setHist((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future], gid: null } : h));
  }, []);
  const redo = useCallback(() => {
    setHist((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1), gid: null } : h));
  }, []);

  return { doc: hist.present, canUndo: hist.past.length > 0, canRedo: hist.future.length > 0, change, undo, redo };
}

function ToolButton({ label, icon, active, onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      title={label}
      className={`flex flex-col items-center justify-center gap-0.5 min-w-[2.75rem] h-11 px-1.5 rounded-xl text-[10px] font-medium transition disabled:opacity-35 ${
        active ? 'bg-cozy-accent-strong text-white shadow-sm' : 'text-cozy-text hover:bg-cozy-bg hover:text-cozy-accent-ink'
      } ${className}`}
    >
      <span aria-hidden="true" className="text-lg leading-none">{icon}</span>
      <span className="leading-none hidden min-[380px]:block">{label}</span>
    </button>
  );
}

function Range({ label, min, max, value, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-medium text-cozy-text shrink-0">
      <span>{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-20 accent-cozy-accent" />
    </label>
  );
}

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 shrink-0 text-xs font-medium text-cozy-text">
      <span>{label}</span>
      <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={`${softButton} !px-2.5`}>−</button>
      <span aria-live="polite" className="w-4 text-center tabular-nums">{value}</span>
      <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={`${softButton} !px-2.5`}>+</button>
    </div>
  );
}

function SizeDots({ sizes, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 shrink-0">
      {sizes.map((s, i) => (
        <button
          key={s}
          type="button"
          aria-label={`${label} ${['thin', 'medium', 'thick'][i]}`}
          aria-pressed={value === i}
          onClick={() => onChange(i)}
          className={`w-8 h-8 rounded-full flex items-center justify-center border ${value === i ? 'border-cozy-accent bg-cozy-bg' : 'border-transparent'}`}
        >
          <span className="rounded-full bg-cozy-text" style={{ width: 4 + i * 5, height: 4 + i * 5 }} />
        </button>
      ))}
    </div>
  );
}

const Divider = () => <span aria-hidden="true" className="w-px h-7 bg-cozy-border shrink-0" />;

export default function PageEditor({ entry, bookTitle, onSave, onClose }) {
  const { userId, backend } = useJournal();
  const [initial] = useState(() => pageDoc(entry.data));
  const { doc, canUndo, canRedo, change, undo, redo } = useHistory(initial);
  const paper = getPaper(doc.paper, doc.paperColor);

  const [mode, setMode] = useState('select');
  const [tool, setTool] = useState('pen');
  const [penColor, setPenColor] = useState(paper.ink);
  const [hlColor, setHlColor] = useState(HIGHLIGHT_COLORS[0]);
  const [penSize, setPenSize] = useState(1);
  const [hlSize, setHlSize] = useState(1);
  const [eraserSize, setEraserSize] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const [photo, setPhoto] = useState({ busy: false, label: '', error: '' });
  const [ghost, setGhost] = useState(null);
  const [toast, setToast] = useState('');
  const [exporting, setExporting] = useState(false);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const areaRef = useRef(null);
  const pageRef = useRef(null);
  const bgRef = useRef(null);
  const overlayRef = useRef(null);
  const liveRef = useRef(null);
  const drawRef = useRef(null);
  const editGid = useRef(null);
  const docRef = useRef(doc);
  const editingRef = useRef(null);
  const savedRef = useRef(initial);
  const onSaveRef = useRef(onSave);
  const savingRef = useRef(false);
  const queuedRef = useRef(null);
  const keyRef = useRef(null);
  const toastTimer = useRef(null);
  const fileRef = useRef(null);
  const placedRef = useRef(0);

  const items = doc.items;
  const selected = items.find((i) => i.id === selectedId) || null;

  useEffect(() => {
    docRef.current = doc;
    editingRef.current = editingId;
    onSaveRef.current = onSave;
  });

  // Saving: ~800ms debounce, one request at a time, flush on close.
  const persist = useCallback(async (first) => {
    if (savingRef.current) {
      queuedRef.current = first;
      return;
    }
    savingRef.current = true;
    setSaving(true);
    let next = first;
    while (next) {
      const { error } = (await onSaveRef.current(cleanDoc(next, editingRef.current))) || {};
      if (error) {
        setSaveError(error);
      } else {
        setSaveError(null);
        savedRef.current = next;
        setSaved(next);
      }
      next = queuedRef.current;
      queuedRef.current = null;
    }
    savingRef.current = false;
    setSaving(false);
  }, []);

  useEffect(() => {
    if (doc === savedRef.current) return undefined;
    const timer = setTimeout(() => persist(doc), 800);
    return () => clearTimeout(timer);
  }, [doc, persist]);

  useEffect(
    () => () => {
      if (docRef.current !== savedRef.current || cleanDoc(docRef.current) !== docRef.current) onSaveRef.current(cleanDoc(docRef.current));
    },
    [],
  );

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      clearTimeout(toastTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([e]) => setArea({ w: e.contentRect.width, h: e.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageWidth = Math.max(0, Math.min(area.w, Math.max(area.h / PAGE_RATIO, Math.min(area.w, 300))));

  const showToast = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  };

  const setItems = useCallback((fn, gid) => change((d) => {
    const next = fn(d.items);
    return next === d.items ? d : { ...d, items: next };
  }, gid), [change]);

  const updateItem = useCallback((id, patch, gid) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)), gid), [setItems]);

  const addItem = (item, edit = false) => {
    const gid = edit ? `edit-${item.id}` : null;
    if (edit) editGid.current = gid;
    setItems((list) => [...list, item], gid);
    setMode('select');
    setSelectedId(item.id);
    setEditingId(edit ? item.id : null);
  };

  const finishEdit = useCallback((id) => {
    setEditingId((current) => (current === id ? null : current));
    setItems((list) => {
      const it = list.find((i) => i.id === id);
      return it && it.type === 'text' && !it.text.trim() ? list.filter((i) => i.id !== id) : list;
    }, editGid.current);
  }, [setItems]);

  const startEdit = (id) => {
    editGid.current = `edit-${id}-${Date.now()}`;
    setEditingId(id);
  };

  const removeSelected = () => {
    if (!selected) return;
    setItems((list) => list.filter((i) => i.id !== selected.id));
    setSelectedId(null);
    setEditingId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = duplicateItem(selected);
    setItems((list) => {
      const index = list.findIndex((i) => i.id === selected.id);
      const next = [...list];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setSelectedId(copy.id);
  };

  const reorder = (delta) => {
    if (!selected) return;
    setItems((list) => {
      const index = list.findIndex((i) => i.id === selected.id);
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const pagePoint = (clientX, clientY, rect = pageRef.current.getBoundingClientRect()) => ({
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  });

  // --- select-mode gestures: move, resize, rotate -------------------------
  const runGesture = (e, onMove, onEnd) => {
    const move = (ev) => onMove(ev);
    const end = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      onEnd?.(ev);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const startMove = (e, item) => {
    if (mode !== 'select' || e.button > 0) return;
    e.stopPropagation();
    if (editingId === item.id) return;
    if (editingId) finishEdit(editingId);
    const wasSelected = selectedId === item.id;
    setSelectedId(item.id);
    const rect = pageRef.current.getBoundingClientRect();
    const gid = `move-${item.id}-${e.timeStamp}`;
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    runGesture(
      e,
      (ev) => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
        moved = true;
        updateItem(item.id, { x: round(item.x + (ev.clientX - sx) / rect.width), y: round(item.y + (ev.clientY - sy) / rect.height) }, gid);
      },
      (ev) => {
        if (!moved && wasSelected && item.type === 'text' && ev.type === 'pointerup') startEdit(item.id);
      },
    );
  };

  const centreOf = () => {
    const r = overlayRef.current.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const item = selected;
    const rect = pageRef.current.getBoundingClientRect();
    const { cx, cy } = centreOf();
    const rad = ((item.r || 0) * Math.PI) / 180;
    const hw = (item.w * rect.width) / 2;
    const hh = item.type === 'text' ? overlayRef.current.offsetHeight / 2 : (item.h * rect.height) / 2;
    const gid = `resize-${item.id}-${e.timeStamp}`;
    const ncx = item.x + item.w / 2;
    const ncy = item.y + item.h / 2;
    runGesture(e, (ev) => {
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      const lx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
      const ly = dx * Math.sin(-rad) + dy * Math.cos(-rad);
      let patch;
      if (item.type === 'text') {
        const w = Math.max(0.08, (2 * Math.abs(lx)) / rect.width);
        patch = { w: round(w), x: round(ncx - w / 2) };
      } else if (item.type === 'washi' || item.type === 'shape') {
        const w = Math.max(0.03, (2 * Math.abs(lx)) / rect.width);
        const h = Math.max(0.015, (2 * Math.abs(ly)) / rect.height);
        patch = { w: round(w), h: round(h), x: round(ncx - w / 2), y: round(ncy - h / 2) };
      } else {
        const s = Math.max(0.1, (lx * hw + ly * hh) / (hw * hw + hh * hh));
        const w = item.w * s;
        const h = item.h * s;
        patch = { w: round(w), h: round(h), x: round(ncx - w / 2), y: round(ncy - h / 2) };
      }
      updateItem(item.id, patch, gid);
    });
  };

  const startRotate = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const item = selected;
    const { cx, cy } = centreOf();
    const gid = `rotate-${item.id}-${e.timeStamp}`;
    runGesture(e, (ev) => {
      let deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      if (deg > 180) deg -= 360;
      const snap = Math.round(deg / 90) * 90;
      if (Math.abs(deg - snap) < 4) deg = snap;
      updateItem(item.id, { r: Math.round(deg * 10) / 10 }, gid);
    });
  };

  // --- draw mode: pen, highlighter, eraser ---------------------------------
  const onPagePointerDown = (e) => {
    if (mode === 'select') {
      if (editingId) finishEdit(editingId);
      setSelectedId(null);
      return;
    }
    if (drawRef.current || e.button > 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const p = pagePoint(e.clientX, e.clientY, rect);
    if (tool === 'eraser') {
      const size = ERASER_SIZES[eraserSize];
      drawRef.current = { pointerId: e.pointerId, rect, erase: true, gid: `erase-${e.timeStamp}`, size, last: p };
      setItems((list) => eraseAt(list, p.x, p.y, size, newItemId), drawRef.current.gid);
      return;
    }
    const highlighter = tool === 'highlighter';
    const raw = {
      id: newItemId(),
      type: 'stroke',
      tool,
      color: highlighter ? hlColor : penColor,
      size: highlighter ? HIGHLIGHTER_SIZES[hlSize] : PEN_SIZES[penSize],
      pts: [],
      pr: !highlighter && e.pointerType === 'pen' ? [] : null,
    };
    addPoint(raw, p.x, p.y, e.pressure || 0.5);
    drawRef.current = { pointerId: e.pointerId, rect, raw };
    drawLive();
  };

  const drawLive = () => {
    const path = liveRef.current;
    const raw = drawRef.current?.raw;
    if (!path || !raw) return;
    const { d, filled } = strokeGeometry(raw);
    const st = strokeStyle(raw);
    path.setAttribute('d', d);
    path.setAttribute('fill', filled ? raw.color : 'none');
    path.setAttribute('stroke', filled ? 'none' : raw.color);
    path.setAttribute('stroke-width', String(st.width));
    path.setAttribute('stroke-linecap', st.cap);
    path.setAttribute('opacity', String(st.opacity));
  };

  const onPagePointerMove = (e) => {
    const g = drawRef.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const events = e.nativeEvent.getCoalescedEvents?.() || [e.nativeEvent];
    if (g.erase) {
      const last = events[events.length - 1];
      const p = pagePoint(last.clientX, last.clientY, g.rect);
      const from = g.last;
      g.last = p;
      setItems((list) => eraseAlong(list, from, p, g.size, newItemId), g.gid);
      return;
    }
    let added = false;
    for (const ev of events) {
      const p = pagePoint(ev.clientX, ev.clientY, g.rect);
      added = addPoint(g.raw, p.x, p.y, ev.pressure || 0.5) || added;
    }
    if (added) drawLive();
  };

  const onPagePointerUp = (e) => {
    const g = drawRef.current;
    if (!g || g.pointerId !== e.pointerId) return;
    drawRef.current = null;
    if (g.raw) {
      if (e.type === 'pointerup') {
        const p = pagePoint(e.clientX, e.clientY, g.rect);
        endPoint(g.raw, p.x, p.y, e.pressure || 0.5);
      }
      const stroke = finishStroke(g.raw);
      setItems((list) => [...list, stroke]);
      liveRef.current?.setAttribute('d', '');
    }
  };

  // --- drawer: tap to place in the middle, drag (mouse / pen) to drop -------
  const nextSpot = () => cascadeSpot(placedRef.current++);
  const placePayload = (payload, at) => {
    const spot = at || nextSpot();
    addItem(decorItem(payload, spot.x, spot.y));
  };

  const dragState = useRef(null);
  const onDrawerDragStart = (e, payload) => {
    if (e.pointerType === 'touch' || e.button > 0) return;
    const sx = e.clientX;
    const sy = e.clientY;
    dragState.current = { dragging: false };
    runGesture(
      e,
      (ev) => {
        if (!dragState.current.dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        dragState.current.dragging = true;
        setGhost({ x: ev.clientX, y: ev.clientY, payload });
      },
      (ev) => {
        const wasDrag = dragState.current?.dragging;
        setGhost(null);
        if (!wasDrag || ev.type !== 'pointerup') return;
        dragState.current.suppressClick = true;
        const rect = pageRef.current.getBoundingClientRect();
        const p = pagePoint(ev.clientX, ev.clientY, rect);
        if (p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1) placePayload(payload, p);
      },
    );
  };
  const onDrawerPick = (payload) => {
    if (dragState.current?.suppressClick) {
      dragState.current = null;
      return;
    }
    placePayload(payload);
  };

  const addImage = (e) => {
    e.preventDefault();
    const url = imageUrl.trim();
    if (!isHttpsUrl(url)) {
      setImageError('Use a full image link that starts with https://');
      return;
    }
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      const spot = nextSpot();
      addItem(imageItem(url, img.naturalWidth / img.naturalHeight, spot.x, spot.y));
      setModal(null);
      setImageUrl('');
      setImageError('');
    };
    img.onerror = () => setImageError('That image could not be loaded. Check the link and try again.');
    img.src = url;
  };

  const addText = () => {
    const spot = nextSpot();
    addItem(textItem(paper.ink, spot.x, spot.y), true);
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setPhoto({ busy: true, label: 'Getting your photo ready…', error: '' });
    try {
      const prepared = await preparePhoto(file);
      setPhoto({ busy: true, label: 'Uploading…', error: '' });
      const { data, error } = await backend.journal.uploadPhoto(userId, prepared.blob, prepared.ext);
      if (error || !data) throw new PhotoError(typeof error === 'string' ? error : 'The photo could not be uploaded. Try again.');
      const spot = nextSpot();
      addItem(imageItem(data, prepared.aspect, spot.x, spot.y));
      setModal(null);
      setPhoto({ busy: false, label: '', error: '' });
    } catch (err) {
      setPhoto({ busy: false, label: '', error: err instanceof PhotoError ? err.message : 'Something went wrong with that photo. Try another one.' });
    }
  };

  const exportPng = async () => {
    setExporting(true);
    try {
      const slug = (entry.data.title || 'journal-page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'journal-page';
      const { skipped } = await exportPagePng({ page: doc, root: pageRef.current, background: bgRef.current, filename: `${slug}.png` });
      showToast(
        skipped
          ? `Page saved as a PNG. ${skipped === 1 ? 'One image was' : `${skipped} images were`} left out because the website hosting it does not allow downloads.`
          : 'Page saved as a PNG.',
      );
    } catch {
      showToast('Sorry, this page could not be exported. An image from another website may be blocking it. Try removing it and export again.');
    }
    setExporting(false);
  };

  // --- keyboard -------------------------------------------------------------
  useEffect(() => {
    keyRef.current = (e) => {
      if (modal) return;
      const tag = e.target.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (key === 'z' || key === 'y')) {
        if (typing) return;
        e.preventDefault();
        if (key === 'y' || e.shiftKey) redo();
        else undo();
        return;
      }
      if (typing) return;
      if (e.key === 'Escape') {
        if (selectedId) setSelectedId(null);
        else if (drawerOpen) setDrawerOpen(false);
        return;
      }
      if (!selected) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeSelected();
        return;
      }
      const step = e.shiftKey ? 0.02 : 0.005;
      const nudges = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (nudges[e.key] && selected.type !== 'stroke') {
        e.preventDefault();
        const [dx, dy] = nudges[e.key];
        updateItem(selected.id, { x: round(selected.x + dx), y: round(selected.y + dy) }, `nudge-${selected.id}`);
      }
    };
  });

  useEffect(() => {
    const onKey = (e) => keyRef.current?.(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const status = saveError ? 'Not saved' : saving || doc !== saved ? 'Saving…' : 'Saved';
  const drawing = mode === 'draw';

  const setColor = (c) => updateItem(selected.id, { color: c }, `color-${selected.id}`);
  const setOpacity = (v) => updateItem(selected.id, { op: v }, `op-${selected.id}`);

  // --- context bar ----------------------------------------------------------
  let contextBar;
  if (drawing) {
    contextBar = (
      <>
        <div role="group" aria-label="Drawing tool" className="flex items-center gap-1 shrink-0">
          {[
            ['pen', 'Pen', '🖊️'],
            ['highlighter', 'Highlighter', '🖍️'],
            ['eraser', 'Eraser', '🧽'],
          ].map(([id, label, icon]) => (
            <button key={id} type="button" onClick={() => setTool(id)} aria-pressed={tool === id} className={`${pill(tool === id)} flex items-center gap-1`}>
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <Divider />
        {tool === 'pen' && (
          <>
            <ColorSwatches label="Pen colour" colors={[...new Set([paper.ink, ...INK_COLORS])]} value={penColor} onChange={setPenColor} />
            <Divider />
            <SizeDots label="Pen width" sizes={PEN_SIZES} value={penSize} onChange={setPenSize} />
          </>
        )}
        {tool === 'highlighter' && (
          <>
            <ColorSwatches label="Highlighter colour" colors={HIGHLIGHT_COLORS} value={hlColor} onChange={setHlColor} />
            <Divider />
            <SizeDots label="Highlighter width" sizes={HIGHLIGHTER_SIZES} value={hlSize} onChange={setHlSize} />
          </>
        )}
        {tool === 'eraser' && <SizeDots label="Eraser size" sizes={ERASER_SIZES} value={eraserSize} onChange={setEraserSize} />}
      </>
    );
  } else if (selected) {
    const typeLabel = { sticker: 'Sticker', image: 'Photo', text: 'Text', washi: 'Tape', shape: 'Shape', stroke: 'Ink', element: 'Element' }[selected.type];
    contextBar = (
      <>
        <span className="text-xs font-semibold text-cozy-muted shrink-0">{typeLabel}</span>
        <button type="button" onClick={() => reorder(1)} className={`${softButton} shrink-0`} aria-label="Bring forward">⬆ Forward</button>
        <button type="button" onClick={() => reorder(-1)} className={`${softButton} shrink-0`} aria-label="Send back">⬇ Back</button>
        <button type="button" onClick={duplicateSelected} className={`${softButton} shrink-0`} aria-label="Duplicate">⧉ Copy</button>
        <button type="button" onClick={removeSelected} className={`${softButton} shrink-0`} aria-label="Delete item">🗑 Delete</button>
        {selected.type === 'text' && (
          <>
            <Divider />
            <div role="group" aria-label="Font" className="flex gap-1 shrink-0">
              {FONTS.map((f) => (
                <button key={f.id} type="button" aria-pressed={selected.font === f.id} onClick={() => updateItem(selected.id, { font: f.id })} className={pill(selected.font === f.id)} style={{ fontFamily: f.css }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Text size" className="flex gap-1 shrink-0">
              {TEXT_SIZES.map((s) => (
                <button key={s.id} type="button" aria-label={`Text size ${s.label}`} aria-pressed={selected.size === s.value} onClick={() => updateItem(selected.id, { size: s.value })} className={pill(selected.size === s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
            <ColorSwatches label="Text colour" colors={[...new Set([paper.ink, ...INK_COLORS])]} value={selected.color} onChange={setColor} />
          </>
        )}
        {selected.type === 'washi' && (
          <>
            <Divider />
            <label className="sr-only" htmlFor="washi-style">Tape pattern</label>
            <select id="washi-style" value={selected.style} onChange={(e) => updateItem(selected.id, { style: e.target.value })} className={`${input} !w-auto shrink-0 !py-1.5`}>
              {WASHI_STYLES.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </>
        )}
        {selected.type === 'shape' && (
          <>
            <Divider />
            {shapeCanFill(selected.shape) && (
              <div role="group" aria-label="Fill style" className="flex gap-1 shrink-0">
                {[['Filled', true], ['Outline', false]].map(([text, on]) => (
                  <button key={text} type="button" aria-pressed={!!selected.filled === on} onClick={() => updateItem(selected.id, { filled: on })} className={pill(!!selected.filled === on)}>
                    {text}
                  </button>
                ))}
              </div>
            )}
            <Range label="Line" min={2} max={24} value={selected.sw ?? 6} onChange={(v) => updateItem(selected.id, { sw: v }, `sw-${selected.id}`)} />
            {shapeHasRadius(selected.shape) && (
              <Range label="Corners" min={0} max={80} value={selected.rad ?? (selected.shape === 'double' ? 6 : 10)} onChange={(v) => updateItem(selected.id, { rad: v }, `rad-${selected.id}`)} />
            )}
          </>
        )}
        {(selected.type === 'washi' || selected.type === 'shape') && (
          <ColorSwatches label="Colour" colors={DECOR_COLORS} value={selected.color} onChange={setColor} opacity={selected.op ?? 1} onOpacity={setOpacity} />
        )}
        {selected.type === 'element' && (
          <>
            <Divider />
            {selected.kind === 'checklist' && (
              <Stepper
                label="Rows"
                value={selected.items.length}
                min={1}
                max={CHECK.maxRows}
                onChange={(n) => {
                  const items = n > selected.items.length ? [...selected.items, { t: '', done: false }] : selected.items.slice(0, n);
                  updateItem(selected.id, withHeight(selected, { items }));
                }}
              />
            )}
            {selected.kind === 'table' && (
              <>
                <Stepper label="Rows" value={selected.rows} min={1} max={TABLE.max} onChange={(n) => updateItem(selected.id, withHeight(selected, { rows: n, cells: resizeCells(selected.cells, n, selected.cols) }))} />
                <Stepper label="Columns" value={selected.cols} min={1} max={TABLE.max} onChange={(n) => updateItem(selected.id, { cols: n, cells: resizeCells(selected.cells, selected.rows, n) })} />
              </>
            )}
            {(selected.kind === 'checklist' || selected.kind === 'table' || selected.kind === 'quote') && (
              <div role="group" aria-label="Font" className="flex gap-1 shrink-0">
                {FONTS.map((f) => (
                  <button key={f.id} type="button" aria-pressed={selected.font === f.id} onClick={() => updateItem(selected.id, { font: f.id })} className={pill(selected.font === f.id)} style={{ fontFamily: f.css }}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}
            <ColorSwatches label="Colour" colors={[...new Set([paper.ink, ...ELEMENT_COLORS])]} value={selected.color} onChange={setColor} opacity={selected.op ?? 1} onOpacity={setOpacity} />
          </>
        )}
      </>
    );
  } else {
    contextBar = <p className="text-xs text-cozy-muted">Tap an item to move, resize or rotate it. Switch to Draw to write by hand.</p>;
  }

  const editor = (
    <div className="fixed inset-0 z-50 flex flex-col bg-cozy-bg font-sans" role="dialog" aria-modal="true" aria-label={`Editing ${entry.data.title || 'page'}`}>
      <header className="flex items-center gap-2 px-3 py-2 border-b border-cozy-border bg-cozy-card">
        <button type="button" onClick={onClose} className={`${softButton} shrink-0`} aria-label="Back to pages">
          ← <span className="hidden sm:inline">Pages</span>
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-base text-cozy-text truncate">{entry.data.title || 'Untitled page'}</h2>
          <p className="text-[11px] text-cozy-muted truncate">
            <span role="status" className={saveError ? 'text-cozy-accent-ink' : ''}>{status}</span>
            {bookTitle && <span> · 📖 {bookTitle}</span>}
          </p>
        </div>
        <ToolButton label="Undo" icon="↶" onClick={undo} disabled={!canUndo} />
        <ToolButton label="Redo" icon="↷" onClick={redo} disabled={!canRedo} />
        <ToolButton label="Export" icon="⤓" onClick={exportPng} disabled={exporting} />
      </header>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4">
          <div ref={areaRef} className="w-full h-full min-h-[200px] flex justify-center items-start">
            <div className="relative shadow-lg" style={{ width: pageWidth, containerType: 'inline-size' }}>
              <PageCanvas
                ref={pageRef}
                bgRef={bgRef}
                page={doc}
                interactive={!drawing}
                editingId={editingId}
                selectedId={selectedId}
                onItemChange={updateItem}
                onItemPointerDown={startMove}
                onItemDoubleClick={(item) => item.type === 'text' && startEdit(item.id)}
                onTextChange={(id, text) => updateItem(id, { text }, editGid.current)}
                onTextBlur={finishEdit}
                onPointerDown={onPagePointerDown}
                onPointerMove={onPagePointerMove}
                onPointerUp={onPagePointerUp}
                onPointerCancel={onPagePointerUp}
                className={`rounded-sm ${drawing ? (tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair') : ''}`}
                style={{ touchAction: drawing ? 'none' : 'pan-y' }}
                aria-label="Journal page"
              >
                <svg viewBox="0 0 1000 1414" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none">
                  <path ref={liveRef} strokeLinejoin="round" />
                </svg>
              </PageCanvas>
              {selected && !drawing && selected.type !== 'stroke' && (
                <div ref={overlayRef} className="absolute pointer-events-none" style={{ ...boxStyle(selected), ...(selected.type === 'text' ? textStyle(selected) : null), color: 'transparent' }}>
                  {selected.type === 'text' && <div aria-hidden="true" className="invisible">{`${selected.text}​`}</div>}
                  <div
                    className={`absolute inset-0 rounded-sm outline outline-2 outline-dashed outline-offset-2 outline-cozy-accent ${editingId === selected.id || selected.type === 'element' ? '' : 'pointer-events-auto cursor-move touch-none'}`}
                    onPointerDown={(e) => startMove(e, selected)}
                    onDoubleClick={() => selected.type === 'text' && startEdit(selected.id)}
                  />
                  <span aria-hidden="true" className="absolute left-1/2 -top-7 h-5 w-px bg-cozy-accent" />
                  <button
                    type="button"
                    aria-label="Rotate"
                    title="Drag to rotate"
                    onPointerDown={startRotate}
                    className="pointer-events-auto touch-none absolute left-1/2 -top-11 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-cozy-accent text-[#c96f6f] text-sm shadow flex items-center justify-center cursor-grab"
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    aria-label="Resize"
                    title="Drag to resize"
                    onPointerDown={startResize}
                    className="pointer-events-auto touch-none absolute -right-4 -bottom-4 w-7 h-7 rounded-full bg-white border-2 border-cozy-accent shadow cursor-nwse-resize flex items-center justify-center text-[#c96f6f] text-xs"
                  >
                    ⤡
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {drawerOpen && <StickerDrawer ink={paper.ink} onPick={onDrawerPick} onDragStart={onDrawerDragStart} onClose={() => setDrawerOpen(false)} />}
      </div>

      <div className="border-t border-cozy-border bg-cozy-card pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide min-h-[3rem]">{contextBar}</div>
        <nav aria-label="Page tools" className="flex items-center justify-between sm:justify-center gap-1 sm:gap-3 px-2 py-1.5 border-t border-cozy-border/60">
          <div role="group" aria-label="Mode" className="flex rounded-xl bg-cozy-bg p-0.5 border border-cozy-border">
            <ToolButton label="Select" icon="👆" active={!drawing} onClick={() => setMode('select')} />
            <ToolButton
              label="Draw"
              icon="✏️"
              active={drawing}
              onClick={() => {
                if (editingId) finishEdit(editingId);
                setSelectedId(null);
                setMode('draw');
              }}
            />
          </div>
          <ToolButton label="Stickers" icon="🌸" active={drawerOpen} onClick={() => setDrawerOpen((o) => !o)} />
          <ToolButton label="Text" icon="🔤" onClick={addText} />
          <ToolButton label="Photo" icon="🖼️" onClick={() => setModal('image')} />
          <ToolButton label="Paper" icon="📄" onClick={() => setModal('paper')} />
        </nav>
      </div>

      {ghost && (
        <div className="fixed z-[70] w-20 h-20 pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-80" style={{ left: ghost.x, top: ghost.y }}>
          <DecorPreview payload={ghost.payload} />
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-36 sm:bottom-32 left-4 right-4 sm:left-auto sm:right-6 z-[70] max-w-sm bg-cozy-paper border border-cozy-primary shadow-lg rounded-2xl px-4 py-3 text-sm text-cozy-text animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );

  return (
    <>
      {createPortal(editor, document.body)}
      {modal === 'image' && (
        <Modal title="Add a photo" labelId="journal-image-title" onClose={() => !photo.busy && setModal(null)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <input
                ref={fileRef}
                id="journal-photo-file"
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  uploadPhoto(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button type="button" disabled={photo.busy} onClick={() => fileRef.current?.click()} className={`${primaryButton} inline-flex items-center gap-2`}>
                📷 Choose a photo
              </button>
              {photo.busy && (
                <p role="status" className="flex items-center gap-2 text-xs text-cozy-text">
                  <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-cozy-primary border-t-cozy-accent animate-spin" />
                  {photo.label}
                </p>
              )}
              {photo.error && <p role="alert" className="text-xs text-cozy-accent-ink">{photo.error}</p>}
              <p className="text-xs text-cozy-muted">Photos are made smaller, and any location details are removed, before they are saved. Up to 15 MB.</p>
            </div>
            <form onSubmit={addImage} className="space-y-3 border-t border-cozy-border pt-4">
              <label htmlFor="journal-image-url" className="block text-xs font-medium text-cozy-text">Or use an image link</label>
              <input id="journal-image-url" type="url" inputMode="url" className={input} placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              {imageError && <p role="alert" className="text-xs text-cozy-accent-ink">{imageError}</p>}
              <button type="submit" disabled={photo.busy} className={primaryButton}>Add image</button>
            </form>
          </div>
        </Modal>
      )}
      {modal === 'paper' && (
        <Modal title="Page style" labelId="journal-paper-title" onClose={() => setModal(null)}>
          <StylePicker
            template={doc.template}
            paper={doc.paper}
            paperColor={doc.paperColor}
            onTemplate={(t) => change((d) => (d.template === t ? d : { ...d, template: t }))}
            onPaper={(p) => change((d) => (d.paper === p ? d : { ...d, paper: p }))}
            onPaperColor={(c) => change((d) => (d.paper === 'custom' && d.paperColor === c ? d : { ...d, paper: 'custom', paperColor: c }), 'paper-colour')}
          />
        </Modal>
      )}
    </>
  );
}

export function StylePicker({ template, paper, paperColor, onTemplate, onPaper, onPaperColor }) {
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-xs font-medium text-cozy-text mb-2">Layout</legend>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} type="button" aria-pressed={template === t.id} onClick={() => onTemplate(t.id)} className={`rounded-xl p-1.5 border-2 text-left transition ${template === t.id ? 'border-cozy-accent' : 'border-transparent hover:border-cozy-primary'}`}>
              <div className="relative w-full overflow-hidden rounded-md shadow-sm ring-1 ring-black/10" style={{ aspectRatio: '1000 / 1414' }}>
                <PageBackground template={t.id} paper={paper} paperColor={paperColor} />
              </div>
              <span className="block mt-1 text-[11px] text-cozy-text leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-xs font-medium text-cozy-text mb-2">Paper</legend>
        <div className="flex flex-wrap gap-2">
          {PAPERS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={paper === p.id}
              onClick={() => onPaper(p.id)}
              className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border-2 text-xs text-cozy-text transition ${paper === p.id ? 'border-cozy-accent' : 'border-cozy-border hover:border-cozy-primary'}`}
            >
              <span aria-hidden="true" className="w-5 h-5 rounded-full ring-1 ring-black/15" style={{ background: p.bg }} />
              {p.label}
            </button>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <button
              type="button"
              aria-pressed={paper === 'custom'}
              onClick={() => onPaperColor(paperColor || '#fbf6ee')}
              className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border-2 text-xs text-cozy-text transition ${paper === 'custom' ? 'border-cozy-accent' : 'border-cozy-border hover:border-cozy-primary'}`}
            >
              <span aria-hidden="true" className="w-5 h-5 rounded-full ring-1 ring-black/15" style={{ background: paperColor || '#fbf6ee' }} />
              Custom
            </button>
            <ColorSwatches label="Paper colour" colors={[]} value={paperColor || '#fbf6ee'} onChange={onPaperColor} />
          </span>
        </div>
      </fieldset>
    </div>
  );
}
