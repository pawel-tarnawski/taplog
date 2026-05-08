import { useRef, useState, useLayoutEffect } from 'react'
import { useTaplogStore } from '../../store/taplogStore'
import { formatMs } from '../../utils/time'
import { PlusIcon } from '../icons'

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000

function totalColor(ms: number): string {
  return ms >= EIGHT_HOURS_MS ? '#4ade80' : '#fb923c'
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

interface SidebarProps {
  showSidebar: boolean
  onAddActivity: () => void
  addBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function Sidebar({ showSidebar, onAddActivity, addBtnRef }: SidebarProps) {
  const activities = useTaplogStore((s) => s.activities)
  const undoSnapshot = useTaplogStore((s) => s.undoSnapshot)
  const totalMs = useTaplogStore((s) => s.totalMs)
  const resetAll = useTaplogStore((s) => s.resetAll)
  const undo = useTaplogStore((s) => s.undo)

  const total = totalMs()

  const asideRef = useRef<HTMLElement>(null)
  const [sidebarWidth, setSidebarWidth] = useState(256)

  useLayoutEffect(() => {
    const el = asideRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width > 0) setSidebarWidth(rect.width)
    const observer = new ResizeObserver(([entry]) => setSidebarWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hasActivities = activities.length > 0

  return (
    <>
      {/* Desktop: fixed right panel */}
      <aside
        ref={asideRef}
        className={`fixed right-0 top-0 h-screen-safe w-[20vw] min-w-[160px] max-w-64 flex-col bg-sidebar p-3 ${showSidebar ? 'flex' : 'hidden'}`}
        style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        <SidebarContent
          activities={activities}
          undoSnapshot={undoSnapshot}
          total={total}
          onResetAll={resetAll}
          onUndo={undo}
          onAddActivity={onAddActivity}
          addBtnRef={addBtnRef}
          sidebarWidth={sidebarWidth}
          hasActivities={hasActivities}
        />
      </aside>

      {/* Mobile: fixed bottom bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 items-center justify-between bg-sidebar px-4 py-3 ${showSidebar ? 'hidden' : 'flex'}`}
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div>
          <p className="text-xs text-muted">Total</p>
          <p className="font-mono text-base font-medium" style={{ color: totalColor(total) }}>
            {formatMs(total)}
          </p>
        </div>
        <div className="flex gap-2">
          {hasActivities && (
            <button
              onClick={onAddActivity}
              aria-label="Add activity"
              className="min-h-[48px] rounded-lg px-3 text-[#3b82f6] transition-colors hover:bg-white/5"
              style={{ border: '1px solid rgba(59,130,246,0.4)' }}
            >
              <PlusIcon size={16} />
            </button>
          )}
          {undoSnapshot && (
            <button
              onClick={undo}
              aria-label="Undo reset"
              className="min-h-[48px] rounded-lg px-3 text-xs font-medium text-[#3b82f6] transition-colors hover:bg-white/5"
              style={{ border: '1px solid rgba(59,130,246,0.4)' }}
            >
              Undo
            </button>
          )}
          <button
            onClick={resetAll}
            aria-label="Reset all"
            className="min-h-[48px] rounded-lg px-3 text-xs font-medium text-danger transition-colors hover:bg-white/5"
            style={{ border: '1px solid rgba(239,68,68,0.4)' }}
          >
            Reset all
          </button>
        </div>
      </div>
    </>
  )
}

// Overhead = padding p-3 (24) + dot+gap (14) + item gap (8) + time counter (56)
const LABEL_OVERHEAD_PX = 102
const CHAR_WIDTH_PX = 7.5 // Inter text-sm average

interface ContentProps {
  activities: ReturnType<typeof useTaplogStore.getState>['activities']
  undoSnapshot: ReturnType<typeof useTaplogStore.getState>['undoSnapshot']
  total: number
  onResetAll: () => void
  onUndo: () => void
  onAddActivity: () => void
  addBtnRef: React.RefObject<HTMLButtonElement | null>
  sidebarWidth: number
  hasActivities: boolean
}

function SidebarContent({
  activities, undoSnapshot, total,
  onResetAll, onUndo, onAddActivity, addBtnRef,
  sidebarWidth, hasActivities,
}: ContentProps) {
  const labelAvailablePx = Math.max(0, sidebarWidth - LABEL_OVERHEAD_PX)
  // Total timer font scales with sidebar width: large on desktop, compact on narrow panels
  const totalFontSize = Math.max(14, Math.min(24, Math.round(sidebarWidth * 0.13)))
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
      {/* Date */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Today</p>
        <p className="mt-1 text-sm font-medium text-primary" data-testid="date-display">
          {todayLabel()}
        </p>
      </div>

      {/* Total */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Total</p>
        <p className="mt-1 font-mono font-medium" style={{ color: totalColor(total), fontSize: totalFontSize }}>
          {formatMs(total)}
        </p>
      </div>

      {/* Per-tile breakdown */}
      {hasActivities && (
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Activities</p>
          <ul className="mt-2 space-y-2">
            {activities.map((a) => {
              const ms =
                a.accumulatedMs +
                (a.isRunning && a.startedAt !== null ? Date.now() - a.startedAt : 0)
              return (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm text-primary">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: a.color }}
                    />
                    <span className="min-w-0 truncate" title={a.name}>
                      {a.code && a.name.length * CHAR_WIDTH_PX > labelAvailablePx ? a.code : a.name}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">{formatMs(ms)}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2">
        {hasActivities && (
          <button
            ref={addBtnRef}
            onClick={onAddActivity}
            aria-label="Add activity"
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-lg text-sm font-medium text-[#3b82f6] transition-colors hover:bg-white/5"
            style={{ border: '1px solid rgba(59,130,246,0.4)' }}
          >
            <PlusIcon size={14} />
            Add activity
          </button>
        )}
        {undoSnapshot && (
          <button
            onClick={onUndo}
            aria-label="Undo reset"
            className="w-full min-h-[48px] rounded-lg text-sm font-medium text-[#3b82f6] transition-colors hover:bg-white/5"
            style={{ border: '1px solid rgba(59,130,246,0.4)' }}
          >
            Undo
          </button>
        )}
        <button
          onClick={onResetAll}
          aria-label="Reset all"
          className="w-full min-h-[48px] rounded-lg text-sm font-medium text-danger transition-colors hover:bg-white/5"
          style={{ border: '1px solid rgba(239,68,68,0.4)' }}
        >
          Reset all
        </button>
      </div>
    </div>
  )
}
