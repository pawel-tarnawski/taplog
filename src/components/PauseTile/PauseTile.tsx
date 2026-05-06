import { useTaplogStore } from '../../store/taplogStore'
import { hexToRgba } from '../../utils/color'
import { PAUSE_COLOR } from '../../utils/tileColors'

export function PauseTile() {
  const activities = useTaplogStore((s) => s.activities)
  const toggleTimer = useTaplogStore((s) => s.toggleTimer)

  const runningActivity = activities.find((a) => a.isRunning) ?? null
  const isIdle = runningActivity === null

  const glowDim = hexToRgba(PAUSE_COLOR, 0.3)
  const glowBright = hexToRgba(PAUSE_COLOR, 0.55)

  return (
    <article
      className={['relative flex flex-col items-center justify-between rounded-xl p-3 transition-all duration-200', isIdle ? 'animate-tile-pulse' : ''].join(' ')}
      style={{
        border: `${isIdle ? '2px' : '1px'} solid ${isIdle ? PAUSE_COLOR : hexToRgba(PAUSE_COLOR, 0.28)}`,
        backgroundColor: 'var(--bg-tile)',
        '--tile-glow-dim': `0 0 18px ${glowDim}`,
        '--tile-glow-bright': `0 0 32px ${glowBright}`,
      } as React.CSSProperties}
    >
      {/* Top label */}
      <div className="flex w-full items-start justify-between">
        <h2 className="text-sm font-semibold text-primary">Pause</h2>
      </div>

      {/* Central pause button */}
      <button
        onClick={() => runningActivity && toggleTimer(runningActivity.id)}
        disabled={isIdle}
        aria-label="Pause tracking"
        aria-pressed={isIdle}
        className="flex h-20 w-20 min-h-[80px] min-w-[80px] items-center justify-center rounded-full text-2xl transition-all duration-200 active:scale-95 disabled:cursor-default"
        style={{
          background: hexToRgba(PAUSE_COLOR, isIdle ? 0.22 : 0.1),
          color: PAUSE_COLOR,
        }}
      >
        ⏸
      </button>

      {/* Bottom status */}
      <div className="flex w-full flex-col items-center gap-0.5">
        <span
          className="text-xs font-medium"
          style={{ color: isIdle ? PAUSE_COLOR : 'transparent' }}
          aria-hidden="true"
        >
          ● Nothing tracked
        </span>
        <div className="font-mono text-lg text-transparent select-none">00:00:00</div>
      </div>
    </article>
  )
}
