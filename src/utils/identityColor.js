/**
 * Deterministic identity colour for avatars.
 *
 * Every Section and every person gets its own consistent hue instead of a
 * uniform brand fill, so a class reads as "my class" wherever it appears and
 * member lists are scannable at a glance. The same key always maps to the same
 * colour, so a Section's colour never changes between pages or sessions.
 *
 * The palette is eight deep, saturated gradients — rich rather than pastel, to
 * match the app's brand-gradient avatars — and every stop is dark enough that
 * white lettering clears 4.5:1 contrast across the whole circle.
 */
const PALETTE = [
  { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', ink: '#ffffff' }, // violet
  { bg: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', ink: '#ffffff' }, // indigo
  { bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', ink: '#ffffff' }, // blue
  { bg: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)', ink: '#ffffff' }, // cyan
  { bg: 'linear-gradient(135deg, #047857 0%, #065f46 100%)', ink: '#ffffff' }, // emerald
  { bg: 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)', ink: '#ffffff' }, // orange
  { bg: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', ink: '#ffffff' }, // rose
  { bg: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)', ink: '#ffffff' }, // pink
];

/** Stable hash → palette index. FNV-ish; order-sensitive so similar names diverge. */
function pickIndex(key) {
  const str = String(key ?? '');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % PALETTE.length;
}

export function identityColor(key) {
  return PALETTE[pickIndex(key)];
}

/** Inline-style object wiring an avatar's CSS custom properties to its identity colour. */
export function identityStyle(key) {
  const c = identityColor(key);
  return { '--avatar-bg': c.bg, '--avatar-ink': c.ink };
}
