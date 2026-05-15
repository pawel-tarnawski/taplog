export interface Activity {
  id: string
  name: string
  code: string            // ≤5-char short label, required; derived from name when blank
  color: string           // hex from TILE_COLORS palette
  accumulatedMs: number
  isRunning: boolean
  startedAt: number | null
}

export interface UndoSnapshot {
  timestamp: number
  activities: Pick<Activity, 'id' | 'accumulatedMs'>[]
}

export interface TaplogState {
  date: string
  activities: Activity[]
}
