import { useTaplogStore } from '../../store/taplogStore'
import { useTick } from '../../hooks/useTick'
import { formatMs } from '../../utils/time'
import { PlusIcon, UndoIcon, ResetIcon } from '../icons'

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
  /** Width of the desktop sidebar panel, passed from App. Falls back to a default for tests. */
  sidebarWidth?: number
  /** Height available for the sidebar — controls the compact-mode switch. */
  sidebarHeight?: number
  onAddActivity: () => void
  addBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function Sidebar({
  showSidebar,
  sidebarWidth = 256,
  sidebarHeight = 600,
  onAddActivity,
  addBtnRef,
}: SidebarProps) {
  const activities = useTaplogStore((s) => s.activities)
  const undoSnapshot = useTaplogStore((s) => s.undoSnapshot)
  const totalMs = useTaplogStore((s) => s.totalMs)
  const resetAll = useTaplogStore((s) => s.resetAll)
  const undo = useTaplogStore((s) => s.undo)

  // Only tick while something is running — totals are otherwise constant.
  const anyRunning = activities.some((a) => a.isRunning)
  useTick(anyRunning ? 1000 : null)

  const total = totalMs()
  const hasActivities = activities.length > 0

  return (
    <>
      {/* Desktop: fixed right panel */}
      <aside
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
          sidebarHeight={sidebarHeight}
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
  sidebarHeight: number
  hasActivities: boolean
}

function SidebarContent({
  activities, undoSnapshot, total,
  onResetAll, onUndo, onAddActivity, addBtnRef,
  sidebarWidth, sidebarHeight, hasActivities,
}: ContentProps) {
  const labelAvailablePx = Math.max(0, sidebarWidth - LABEL_OVERHEAD_PX)
  const totalFontSize = Math.max(14, Math.min(24, Math.round(sidebarWidth * 0.13)))
  // Compact when sidebar is short: replace stacked text buttons with icon row
  const compact = sidebarHeight > 0 && sidebarHeight < 500
  return (
    <div className={`flex flex-1 flex-col ${compact ? 'gap-2' : 'gap-4'}`}>
      {/* Date — hidden in compact to reclaim vertical space */}
      {!compact && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Today</p>
          <p className="mt-1 text-sm font-medium text-primary" data-testid="date-display">
            {todayLabel()}
          </p>
        </div>
      )}

      {/* Total */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Total</p>
        <p className="mt-1 font-mono font-medium" style={{ color: totalColor(total), fontSize: totalFontSize }}>
          {formatMs(total)}
        </p>
      </div>

      {/* Per-tile breakdown — flex-1 + min-h-0 keeps it bounded; scrolls internally */}
      {hasActivities && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!compact && <p className="text-xs font-medium uppercase tracking-wider text-muted">Activities</p>}
          <ul className={compact ? 'space-y-1' : 'mt-2 space-y-2'}>
            {activities.map((a) => {
              const ms =
                a.accumulatedMs +
                (a.isRunning && a.startedAt !== null ? Date.now() - a.startedAt : 0)
              const label = a.code && a.name.length * CHAR_WIDTH_PX > labelAvailablePx ? a.code : a.name
              return (
                <li key={a.id} className="flex items-center justify-between gap-1">
                  {!compact && (
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: a.color }}
                    />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate ${compact ? 'text-[11px]' : 'text-sm'} font-medium`}
                    style={{ color: a.color }}
                    title={a.name}
                  >
                    {label}
                  </span>
                  <span
                    className={`shrink-0 font-mono ${compact ? 'text-[10px]' : 'text-xs'}`}
                    style={{ color: a.color }}
                  >
                    {formatMs(ms)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Actions */}
      {compact ? (
        /* Compact: icon-only row — saves ~120px vs stacked text buttons */
        <div className="mt-auto flex gap-2">
          {hasActivities && (
            <button
              ref={addBtnRef}
              onClick={onAddActivity}
              aria-label="Add activity"
              className="flex flex-1 items-center justify-center rounded-lg py-2 text-[#3b82f6] transition-colors hover:bg-white/10"
              style={{ border: '1px solid rgba(59,130,246,0.4)', minHeight: 36 }}
            >
              <PlusIcon size={16} />
            </button>
          )}
          {undoSnapshot && (
            <button
              onClick={onUndo}
              aria-label="Undo reset"
              className="flex flex-1 items-center justify-center rounded-lg py-2 text-[#3b82f6] transition-colors hover:bg-white/10"
              style={{ border: '1px solid rgba(59,130,246,0.4)', minHeight: 36 }}
            >
              <UndoIcon size={16} />
            </button>
          )}
          <button
            onClick={onResetAll}
            aria-label="Reset all"
            className="flex flex-1 items-center justify-center rounded-lg py-2 text-danger transition-colors hover:bg-white/10"
            style={{ border: '1px solid rgba(239,68,68,0.4)', minHeight: 36 }}
          >
            <ResetIcon size={16} />
          </button>
        </div>
      ) : (
        /* Full: labelled vertical stack */
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
      )}
    </div>
  )
}
