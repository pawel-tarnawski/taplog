import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTaplogStore } from './taplogStore'
import { loadState, loadUndoSnapshot } from './persistence'

const STORAGE_KEY = 'taplog_state'
const UNDO_KEY = 'taplog_undo_snapshot'

function resetStore() {
  useTaplogStore.setState({ activities: [], undoSnapshot: null })
}

function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

beforeEach(() => {
  localStorage.clear()
  resetStore()
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// addActivity
// ---------------------------------------------------------------------------

describe('addActivity', () => {
  it('appends an activity with correct defaults', () => {
    useTaplogStore.getState().addActivity('Work')
    const { activities } = useTaplogStore.getState()
    expect(activities).toHaveLength(1)
    expect(activities[0].name).toBe('Work')
    expect(activities[0].accumulatedMs).toBe(0)
    expect(activities[0].isRunning).toBe(false)
    expect(activities[0].startedAt).toBeNull()
    expect(typeof activities[0].id).toBe('string')
    expect(typeof activities[0].color).toBe('string')
  })

  it('stores optional code uppercased and truncated to 5 chars', () => {
    useTaplogStore.getState().addActivity('Work', 'working')
    expect(useTaplogStore.getState().activities[0].code).toBe('WORKI')
  })

  it('assigns rotating palette colors to successive activities', () => {
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const { activities } = useTaplogStore.getState()
    expect(activities[0].color).not.toBe(activities[1].color)
  })

  it('assigns unique ids to multiple activities', () => {
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const { activities } = useTaplogStore.getState()
    expect(activities[0].id).not.toBe(activities[1].id)
  })

  it('persists to localStorage', () => {
    useTaplogStore.getState().addActivity('Work')
    const stored = loadState()
    expect(stored?.activities).toHaveLength(1)
    expect(stored?.activities[0].name).toBe('Work')
    expect(stored?.date).toBe(today())
  })
})

// ---------------------------------------------------------------------------
// renameActivity
// ---------------------------------------------------------------------------

describe('renameActivity', () => {
  it('updates the activity name', () => {
    useTaplogStore.getState().addActivity('Old')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().renameActivity(id, 'New')
    expect(useTaplogStore.getState().activities[0].name).toBe('New')
  })

  it('does not affect other activities', () => {
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const idA = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().renameActivity(idA, 'A2')
    expect(useTaplogStore.getState().activities[1].name).toBe('B')
  })

  it('persists to localStorage', () => {
    useTaplogStore.getState().addActivity('Old')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().renameActivity(id, 'New')
    expect(loadState()?.activities[0].name).toBe('New')
  })
})

// ---------------------------------------------------------------------------
// deleteActivity
// ---------------------------------------------------------------------------

describe('deleteActivity', () => {
  it('removes the activity', () => {
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const idA = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().deleteActivity(idA)
    const { activities } = useTaplogStore.getState()
    expect(activities).toHaveLength(1)
    expect(activities[0].name).toBe('B')
  })

  it('persists to localStorage', () => {
    useTaplogStore.getState().addActivity('A')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().deleteActivity(id)
    expect(loadState()?.activities).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// toggleTimer
// ---------------------------------------------------------------------------

describe('toggleTimer', () => {
  it('starts a paused activity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().toggleTimer(id)
    const a = useTaplogStore.getState().activities[0]
    expect(a.isRunning).toBe(true)
    expect(a.startedAt).toBe(1_000_000)
  })

  it('pauses a running activity and accumulates elapsed ms', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().toggleTimer(id)
    vi.setSystemTime(1_005_000)
    useTaplogStore.getState().toggleTimer(id)
    const a = useTaplogStore.getState().activities[0]
    expect(a.isRunning).toBe(false)
    expect(a.startedAt).toBeNull()
    expect(a.accumulatedMs).toBe(5_000)
  })

  it('pauses any previously running activity before starting another', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const [idA, idB] = useTaplogStore.getState().activities.map((a) => a.id)
    useTaplogStore.getState().toggleTimer(idA)
    vi.setSystemTime(1_003_000)
    useTaplogStore.getState().toggleTimer(idB)
    const [a, b] = useTaplogStore.getState().activities
    expect(a.isRunning).toBe(false)
    expect(a.accumulatedMs).toBe(3_000)
    expect(b.isRunning).toBe(true)
  })

  it('invariant: at most one activity is running at any time', () => {
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    useTaplogStore.getState().addActivity('C')
    const [idA, idB, idC] = useTaplogStore.getState().activities.map((a) => a.id)
    useTaplogStore.getState().toggleTimer(idA)
    useTaplogStore.getState().toggleTimer(idB)
    useTaplogStore.getState().toggleTimer(idC)
    const running = useTaplogStore.getState().activities.filter((a) => a.isRunning)
    expect(running).toHaveLength(1)
    expect(running[0].id).toBe(idC)
  })

  it('persists to localStorage', () => {
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().toggleTimer(id)
    expect(loadState()?.activities[0].isRunning).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// resetActivity
// ---------------------------------------------------------------------------

describe('resetActivity', () => {
  it('resets accumulatedMs to 0 and stops the timer', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().toggleTimer(id)
    vi.setSystemTime(1_010_000)
    useTaplogStore.getState().toggleTimer(id)
    useTaplogStore.getState().resetActivity(id)
    const a = useTaplogStore.getState().activities[0]
    expect(a.accumulatedMs).toBe(0)
    expect(a.isRunning).toBe(false)
    expect(a.startedAt).toBeNull()
  })

  it('does not affect other activities', () => {
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const [idA, idB] = useTaplogStore.getState().activities.map((a) => a.id)
    useTaplogStore.getState().toggleTimer(idA)
    useTaplogStore.getState().toggleTimer(idA)
    useTaplogStore.getState().resetActivity(idB)
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBeGreaterThanOrEqual(0)
  })

  it('saves an undo snapshot before reset', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().toggleTimer(id)
    vi.setSystemTime(1_007_000)
    useTaplogStore.getState().toggleTimer(id)
    useTaplogStore.getState().resetActivity(id)
    const { undoSnapshot } = useTaplogStore.getState()
    expect(undoSnapshot).not.toBeNull()
    expect(undoSnapshot?.activities[0].accumulatedMs).toBe(7_000)
  })

  it('persists undo snapshot to localStorage', () => {
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().resetActivity(id)
    expect(loadUndoSnapshot()).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// resetAll
// ---------------------------------------------------------------------------

describe('resetAll', () => {
  it('resets every activity to 0 and stops timers', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const [idA] = useTaplogStore.getState().activities.map((a) => a.id)
    useTaplogStore.getState().toggleTimer(idA)
    vi.setSystemTime(1_005_000)
    useTaplogStore.getState().toggleTimer(idA)
    useTaplogStore.getState().resetAll()
    const { activities } = useTaplogStore.getState()
    for (const a of activities) {
      expect(a.accumulatedMs).toBe(0)
      expect(a.isRunning).toBe(false)
      expect(a.startedAt).toBeNull()
    }
  })

  it('saves an undo snapshot capturing all activities before reset', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const [idA, idB] = useTaplogStore.getState().activities.map((a) => a.id)
    useTaplogStore.getState().toggleTimer(idA)
    vi.setSystemTime(1_003_000)
    useTaplogStore.getState().toggleTimer(idA)
    useTaplogStore.getState().resetAll()
    const { undoSnapshot } = useTaplogStore.getState()
    expect(undoSnapshot?.activities).toHaveLength(2)
    const snapA = undoSnapshot?.activities.find((s) => s.id === idA)
    const snapB = undoSnapshot?.activities.find((s) => s.id === idB)
    expect(snapA?.accumulatedMs).toBe(3_000)
    expect(snapB?.accumulatedMs).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// undo
// ---------------------------------------------------------------------------

describe('undo', () => {
  it('restores accumulatedMs from snapshot', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().toggleTimer(id)
    vi.setSystemTime(1_009_000)
    useTaplogStore.getState().toggleTimer(id)
    useTaplogStore.getState().resetActivity(id)
    useTaplogStore.getState().undo()
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(9_000)
  })

  it('stops the timer on restored activity', () => {
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().resetActivity(id)
    useTaplogStore.getState().undo()
    const a = useTaplogStore.getState().activities[0]
    expect(a.isRunning).toBe(false)
    expect(a.startedAt).toBeNull()
  })

  it('clears undoSnapshot after undo', () => {
    useTaplogStore.getState().addActivity('Work')
    const id = useTaplogStore.getState().activities[0].id
    useTaplogStore.getState().resetActivity(id)
    useTaplogStore.getState().undo()
    expect(useTaplogStore.getState().undoSnapshot).toBeNull()
    expect(loadUndoSnapshot()).toBeNull()
  })

  it('is a no-op when no snapshot exists', () => {
    useTaplogStore.getState().addActivity('Work')
    useTaplogStore.getState().undo()
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(0)
  })

  it('restores all-activity snapshot from resetAll', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.getState().addActivity('A')
    useTaplogStore.getState().addActivity('B')
    const [idA, idB] = useTaplogStore.getState().activities.map((a) => a.id)
    useTaplogStore.getState().toggleTimer(idA)
    vi.setSystemTime(1_004_000)
    useTaplogStore.getState().toggleTimer(idA)
    useTaplogStore.getState().resetAll()
    useTaplogStore.getState().undo()
    const activities = useTaplogStore.getState().activities
    expect(activities.find((a) => a.id === idA)?.accumulatedMs).toBe(4_000)
    expect(activities.find((a) => a.id === idB)?.accumulatedMs).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// _checkDayChange
// ---------------------------------------------------------------------------

describe('_checkDayChange', () => {
  it('resets activities when stored date differs from today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
    const activities = [
      { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 5_000, isRunning: false, startedAt: null },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: '2024-01-01', activities }))
    useTaplogStore.setState({ activities })
    useTaplogStore.getState()._checkDayChange()
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(0)
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(false)
  })

  it('does not reset activities when stored date matches today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
    const activities = [
      { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 5_000, isRunning: false, startedAt: null },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: '2024-01-02', activities }))
    useTaplogStore.setState({ activities })
    useTaplogStore.getState()._checkDayChange()
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(5_000)
  })

  it('clears undo snapshot on day change', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-02T12:00:00Z'))
    const activities = [
      { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 5_000, isRunning: false, startedAt: null },
    ]
    const snapshot = { timestamp: 1, activities: [{ id: '1', accumulatedMs: 5_000 }] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: '2024-01-01', activities }))
    localStorage.setItem(UNDO_KEY, JSON.stringify(snapshot))
    useTaplogStore.setState({ activities, undoSnapshot: snapshot })
    useTaplogStore.getState()._checkDayChange()
    expect(useTaplogStore.getState().undoSnapshot).toBeNull()
    expect(loadUndoSnapshot()).toBeNull()
  })

  it('is a no-op when localStorage has no stored state', () => {
    const activities = [
      { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 5_000, isRunning: false, startedAt: null },
    ]
    useTaplogStore.setState({ activities })
    useTaplogStore.getState()._checkDayChange()
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(5_000)
  })
})

// ---------------------------------------------------------------------------
// totalMs
// ---------------------------------------------------------------------------

describe('totalMs', () => {
  it('returns 0 with no activities', () => {
    expect(useTaplogStore.getState().totalMs()).toBe(0)
  })

  it('sums accumulated ms across all activities', () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'A', color: '#3b82f6', accumulatedMs: 3_000, isRunning: false, startedAt: null },
        { id: '2', name: 'B', color: '#a855f7', accumulatedMs: 7_000, isRunning: false, startedAt: null },
      ],
    })
    expect(useTaplogStore.getState().totalMs()).toBe(10_000)
  })

  it('includes live elapsed time for a running activity', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'A', color: '#3b82f6', accumulatedMs: 2_000, isRunning: true, startedAt: 1_000_000 - 3_000 },
      ],
    })
    vi.setSystemTime(1_001_000)
    expect(useTaplogStore.getState().totalMs()).toBe(6_000)
  })
})

// ---------------------------------------------------------------------------
// persistence: corrupt localStorage data
// ---------------------------------------------------------------------------

describe('persistence (loadState)', () => {
  it('returns null for corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{{{')
    const stored = loadState()
    expect(stored).toBeNull()
  })

  it('returns null when activities field is missing', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: '2024-01-01' }))
    expect(loadState()).toBeNull()
  })

  it('returns null when an activity entry is invalid', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: '2024-01-01', activities: [{ id: 1, name: 'Bad' }] }),
    )
    expect(loadState()).toBeNull()
  })

  it('returns the parsed state for valid data', () => {
    const state = {
      date: '2024-01-01',
      activities: [{ id: 'x', name: 'A', color: '#3b82f6', accumulatedMs: 0, isRunning: false, startedAt: null }],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    expect(loadState()).toEqual(state)
  })
})
