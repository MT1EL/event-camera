function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic muted avatar background derived from a name/seed. */
export function avatarColor(seed: string): string {
  const h = hashStr(seed || "untitled");
  const hue = (h * 9301) % 360;
  const sat = 8 + (h % 8);
  const light = 14 + ((h >> 3) % 12);
  return `hsl(${hue} ${sat}% ${light}%)`;
}
