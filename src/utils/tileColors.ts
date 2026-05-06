export const TILE_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f43f5e', // rose
  '#6366f1', // indigo
] as const

export const PAUSE_COLOR = '#f59e0b' as const

export function nextTileColor(currentCount: number): string {
  return TILE_COLORS[currentCount % TILE_COLORS.length]
}
