/** Convert a 6-digit hex color to rgba(), e.g. '#3b82f6', 0.35 → 'rgba(59,130,246,0.35)' */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
