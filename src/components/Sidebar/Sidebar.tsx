import { useTaplogStore } from '../../store/taplogStore'
import { formatMs } from '../../utils/time'

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function Sidebar() {
  const activities = useTaplogStore((s) => s.activities)
  const undoSnapshot = useTaplogStore((s) => s.undoSnapshot)
  const totalMs = useTaplogStore((s) => s.totalMs)
  const resetAll = useTaplogStore((s) => s.resetAll)
  const undo = useTaplogStore((s) => s.undo)

  const total = totalMs()

  return (
    <>
      {/* Desktop: fixed right panel */}
      <aside className="fixed right-0 top-0 hidden h-screen w-64 flex-col border-l border-white/10 bg-sidebar p-5 sm:flex">
        <SidebarContent
          activities={activities}
          undoSnapshot={undoSnapshot}
          total={total}
          onResetAll={resetAll}
          onUndo={undo}
        />
      </aside>

      {/* Mobile: fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/10 bg-sidebar px-4 py-3 sm:hidden">
        <div>
          <p className="text-xs text-muted">Total</p>
          <p className="font-mono text-base font-medium text-primary">{formatMs(total)}</p>
        </div>
        <div className="flex gap-2">
          {undoSnapshot && (
            <button
              onClick={undo}
              aria-label="Undo reset"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent ring-1 ring-accent/40 transition-colors hover:bg-accent/10"
            >
              Undo
            </button>
          )}
          <button
            onClick={resetAll}
            aria-label="Reset all"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-danger ring-1 ring-danger/40 transition-colors hover:bg-danger/10"
          >
            Reset all
          </button>
        </div>
      </div>
    </>
  )
}

interface ContentProps {
  activities: ReturnType<typeof useTaplogStore.getState>['activities']
  undoSnapshot: ReturnType<typeof useTaplogStore.getState>['undoSnapshot']
  total: number
  onResetAll: () => void
  onUndo: () => void
}

function SidebarContent({ activities, undoSnapshot, total, onResetAll, onUndo }: ContentProps) {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto">
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
        <p className="mt-1 font-mono text-2xl font-medium text-primary">{formatMs(total)}</p>
      </div>

      {/* Per-tile breakdown */}
      {activities.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Activities</p>
          <ul className="mt-2 space-y-2">
            {activities.map((a) => {
              const ms =
                a.accumulatedMs +
                (a.isRunning && a.startedAt !== null ? Date.now() - a.startedAt : 0)
              return (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm text-primary" title={a.name}>
                    {a.name}
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
        {undoSnapshot && (
          <button
            onClick={onUndo}
            aria-label="Undo reset"
            className="w-full rounded-lg py-2 text-sm font-medium text-accent ring-1 ring-accent/40 transition-colors hover:bg-accent/10"
          >
            Undo
          </button>
        )}
        <button
          onClick={onResetAll}
          aria-label="Reset all"
          className="w-full rounded-lg py-2 text-sm font-medium text-danger ring-1 ring-danger/40 transition-colors hover:bg-danger/10"
        >
          Reset all
        </button>
      </div>
    </div>
  )
}
