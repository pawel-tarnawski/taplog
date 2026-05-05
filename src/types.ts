export interface Activity {
  id: string
  name: string
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
