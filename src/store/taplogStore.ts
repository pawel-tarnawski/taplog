import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Activity, UndoSnapshot } from '../types'
import {
  loadState,
  saveState,
  loadUndoSnapshot,
  saveUndoSnapshot,
  clearUndoSnapshot,
} from './persistence'

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

interface TaplogStore {
  activities: Activity[]
  undoSnapshot: UndoSnapshot | null

  totalMs: () => number

  addActivity: (name: string) => void
  renameActivity: (id: string, name: string) => void
  deleteActivity: (id: string) => void
  toggleTimer: (id: string) => void
  resetActivity: (id: string) => void
  resetAll: () => void
  undo: () => void

  _persist: () => void
  _checkDayChange: () => void
}

function buildInitialState(): Pick<TaplogStore, 'activities' | 'undoSnapshot'> {
  const stored = loadState()
  const today = todayString()

  if (!stored) {
    return { activities: [], undoSnapshot: null }
  }

  if (stored.date !== today) {
    const activities = stored.activities.map((a) => ({
      ...a,
      accumulatedMs: 0,
      isRunning: false,
      startedAt: null,
    }))
    saveState({ date: today, activities })
    clearUndoSnapshot()
    return { activities, undoSnapshot: null }
  }

  return { activities: stored.activities, undoSnapshot: loadUndoSnapshot() }
}

const initial = buildInitialState()

export const useTaplogStore = create<TaplogStore>()((set, get) => ({
  activities: initial.activities,
  undoSnapshot: initial.undoSnapshot,

  totalMs: () => {
    const now = Date.now()
    return get().activities.reduce((sum, a) => {
      return sum + a.accumulatedMs + (a.isRunning && a.startedAt !== null ? now - a.startedAt : 0)
    }, 0)
  },

  addActivity: (name: string) => {
    const activity: Activity = {
      id: nanoid(),
      name,
      accumulatedMs: 0,
      isRunning: false,
      startedAt: null,
    }
    set((state) => ({ activities: [...state.activities, activity] }))
    get()._persist()
  },

  renameActivity: (id: string, name: string) => {
    set((state) => ({
      activities: state.activities.map((a) => (a.id === id ? { ...a, name } : a)),
    }))
    get()._persist()
  },

  deleteActivity: (id: string) => {
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
    }))
    get()._persist()
  },

  toggleTimer: (id: string) => {
    const now = Date.now()
    set((state) => ({
      activities: state.activities.map((a) => {
        if (a.isRunning && a.id !== id) {
          return {
            ...a,
            accumulatedMs: a.accumulatedMs + (a.startedAt !== null ? now - a.startedAt : 0),
            isRunning: false,
            startedAt: null,
          }
        }
        if (a.id === id) {
          if (a.isRunning) {
            return {
              ...a,
              accumulatedMs: a.accumulatedMs + (a.startedAt !== null ? now - a.startedAt : 0),
              isRunning: false,
              startedAt: null,
            }
          }
          return { ...a, isRunning: true, startedAt: now }
        }
        return a
      }),
    }))
    get()._persist()
  },

  resetActivity: (id: string) => {
    const snapshot: UndoSnapshot = {
      timestamp: Date.now(),
      activities: get().activities.map((a) => ({ id: a.id, accumulatedMs: a.accumulatedMs })),
    }
    saveUndoSnapshot(snapshot)
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, accumulatedMs: 0, isRunning: false, startedAt: null } : a,
      ),
      undoSnapshot: snapshot,
    }))
    get()._persist()
  },

  resetAll: () => {
    const snapshot: UndoSnapshot = {
      timestamp: Date.now(),
      activities: get().activities.map((a) => ({ id: a.id, accumulatedMs: a.accumulatedMs })),
    }
    saveUndoSnapshot(snapshot)
    set((state) => ({
      activities: state.activities.map((a) => ({
        ...a,
        accumulatedMs: 0,
        isRunning: false,
        startedAt: null,
      })),
      undoSnapshot: snapshot,
    }))
    get()._persist()
  },

  undo: () => {
    const { undoSnapshot } = get()
    if (!undoSnapshot) return
    set((state) => ({
      activities: state.activities.map((a) => {
        const snap = undoSnapshot.activities.find((s) => s.id === a.id)
        return snap ? { ...a, accumulatedMs: snap.accumulatedMs, isRunning: false, startedAt: null } : a
      }),
      undoSnapshot: null,
    }))
    clearUndoSnapshot()
    get()._persist()
  },

  _persist: () => {
    saveState({ date: todayString(), activities: get().activities })
  },

  _checkDayChange: () => {
    const stored = loadState()
    const today = todayString()
    if (!stored || stored.date === today) return
    const activities = get().activities.map((a) => ({
      ...a,
      accumulatedMs: 0,
      isRunning: false,
      startedAt: null,
    }))
    clearUndoSnapshot()
    set({ activities, undoSnapshot: null })
    get()._persist()
  },
}))
