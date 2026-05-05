import type { Activity, TaplogState, UndoSnapshot } from '../types'

const STATE_KEY = 'taplog_state'
const UNDO_KEY = 'taplog_undo_snapshot'

function isValidActivity(value: unknown): value is Activity {
  if (typeof value !== 'object' || value === null) return false
  const a = value as Record<string, unknown>
  return (
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    typeof a.accumulatedMs === 'number' &&
    typeof a.isRunning === 'boolean' &&
    (a.startedAt === null || typeof a.startedAt === 'number')
  )
}

function isValidState(value: unknown): value is TaplogState {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.date === 'string' &&
    Array.isArray(s.activities) &&
    (s.activities as unknown[]).every(isValidActivity)
  )
}

function isValidUndoSnapshot(value: unknown): value is UndoSnapshot {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  if (typeof s.timestamp !== 'number' || !Array.isArray(s.activities)) return false
  return (s.activities as unknown[]).every(
    (a) =>
      typeof a === 'object' &&
      a !== null &&
      typeof (a as Record<string, unknown>).id === 'string' &&
      typeof (a as Record<string, unknown>).accumulatedMs === 'number',
  )
}

export function loadState(): TaplogState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveState(state: TaplogState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage quota errors
  }
}

export function loadUndoSnapshot(): UndoSnapshot | null {
  try {
    const raw = localStorage.getItem(UNDO_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidUndoSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveUndoSnapshot(snapshot: UndoSnapshot): void {
  try {
    localStorage.setItem(UNDO_KEY, JSON.stringify(snapshot))
  } catch {
    // ignore storage quota errors
  }
}

export function clearUndoSnapshot(): void {
  localStorage.removeItem(UNDO_KEY)
}
