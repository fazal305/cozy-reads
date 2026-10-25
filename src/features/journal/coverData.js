// Each cover: base CSS background, an optional SVG texture, stitch and ribbon colours.
export const COVERS = [
  { id: 'leather-brown', label: 'Brown leather', base: 'radial-gradient(120% 90% at 30% 20%, #9a6644 0%, #7a4a2e 55%, #5a3420 100%)', texture: 'grain', stitch: '#e9c99a', ribbon: '#b5524f' },
  { id: 'leather-black', label: 'Black leather', base: 'radial-gradient(120% 90% at 30% 20%, #4a4644 0%, #2a2726 55%, #171515 100%)', texture: 'grain', stitch: '#c9a86a', ribbon: '#c9a86a' },
  { id: 'croc-pink', label: 'Pink croc', base: 'linear-gradient(135deg, #f6b6c4 0%, #e88aa0 60%, #d46f88 100%)', texture: 'croc', stitch: '#fff3f5', ribbon: '#8a3b52' },
  { id: 'croc-black', label: 'Black croc', base: 'linear-gradient(135deg, #3a3637 0%, #201d1e 60%, #121011 100%)', texture: 'croc', stitch: '#d9b779', ribbon: '#b5524f' },
  { id: 'cow', label: 'Cow print', base: '#fbf8f2', texture: 'cow', stitch: '#3b2f2f', ribbon: '#e88a8a' },
  { id: 'linen', label: 'Linen', base: 'repeating-linear-gradient(0deg, rgba(120,98,70,.10) 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, rgba(120,98,70,.10) 0 1px, transparent 1px 4px), #e8dcc6', stitch: '#8a6a3b', ribbon: '#4f7a63' },
  { id: 'marble', label: 'Marble', base: 'linear-gradient(160deg, #ffffff 0%, #f1efee 45%, #e6e3e1 100%)', texture: 'marble', stitch: '#c9a86a', ribbon: '#c9a86a' },
  { id: 'velvet', label: 'Emerald velvet', base: 'radial-gradient(90% 70% at 35% 25%, #2f8a6c 0%, #1d5c48 45%, #0f3a2d 100%)', texture: 'sheen', stitch: '#e6c27a', ribbon: '#e6c27a' },
  { id: 'floral', label: 'Floral', base: '#fcefe9', texture: 'floral', stitch: '#cc6f7c', ribbon: '#6a8d6c' },
  { id: 'checker', label: 'Pastel checker', base: 'repeating-conic-gradient(#f9d9e0 0 25%, #dcebdc 0 50%) 0 0 / 44px 44px', stitch: '#ffffff', ribbon: '#a7c7e7' },
];

export function getCover(id) {
  return COVERS.find((c) => c.id === id) || COVERS[0];
}
