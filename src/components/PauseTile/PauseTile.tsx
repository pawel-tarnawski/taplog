import { useTaplogStore } from '../../store/taplogStore'
import { hexToRgba } from '../../utils/color'
import { PAUSE_COLOR } from '../../utils/tileColors'

interface Props {
  tileWidth?: number
  tileHeight?: number
}

function pauseScale(w: number, h: number) {
  const d = Math.min(w || 200, h || 200)
  return {
    btnSize:   Math.max(80,  Math.min(Math.round(d * 0.44), 220)),
    iconSize:  Math.max(20,  Math.min(Math.round(d * 0.18),  88)),
    nameSize:  Math.max(15,  Math.min(Math.round(d * 0.10),  52)),
    dotSize:   Math.max(10,  Math.min(Math.round(d * 0.055), 18)),
  }
}

export function PauseTile({ tileWidth = 0, tileHeight = 0 }: Props) {
  const activities = useTaplogStore((s) => s.activities)
  const toggleTimer = useTaplogStore((s) => s.toggleTimer)

  const runningActivity = activities.find((a) => a.isRunning) ?? null
  const isIdle = runningActivity === null

  const { btnSize, iconSize, nameSize, dotSize } = pauseScale(tileWidth, tileHeight)

  const glowDim = hexToRgba(PAUSE_COLOR, 0.3)
  const glowBright = hexToRgba(PAUSE_COLOR, 0.55)

  return (
    <article
      className={[
        'relative flex flex-col items-center justify-between rounded-xl p-3 transition-all duration-200',
        isIdle ? 'animate-tile-pulse' : '',
      ].join(' ')}
      style={{
        border: `${isIdle ? '2px' : '1px'} solid ${isIdle ? PAUSE_COLOR : hexToRgba(PAUSE_COLOR, 0.28)}`,
        backgroundColor: 'var(--bg-tile)',
        '--tile-glow-dim': `0 0 18px ${glowDim}`,
        '--tile-glow-bright': `0 0 32px ${glowBright}`,
      } as React.CSSProperties}
    >
      {/* Top label */}
      <div className="flex w-full items-start">
        <h2 className="font-bold leading-tight text-primary" style={{ fontSize: nameSize }}>
          Pause
        </h2>
      </div>

      {/* Central pause button */}
      <button
        onClick={() => runningActivity && toggleTimer(runningActivity.id)}
        disabled={isIdle}
        aria-label="Pause tracking"
        aria-pressed={isIdle}
        className="flex shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95 disabled:cursor-default"
        style={{
          width: btnSize,
          height: btnSize,
          minWidth: 80,
          minHeight: 80,
          fontSize: iconSize,
          background: hexToRgba(PAUSE_COLOR, isIdle ? 0.22 : 0.1),
          color: PAUSE_COLOR,
        }}
      >
        ⏸
      </button>

      {/* Bottom status */}
      <div className="flex w-full flex-col items-center">
        <span
          className="font-medium"
          style={{ fontSize: dotSize, color: isIdle ? PAUSE_COLOR : 'transparent' }}
          aria-hidden="true"
        >
          ● Nothing tracked
        </span>
        {/* Spacer to match ActivityTile timer row height */}
        <div className="font-mono font-medium text-transparent select-none" style={{ fontSize: Math.max(11, Math.round(Math.min(tileWidth || 200, tileHeight || 200) * 0.08)) }}>
          00:00:00
        </div>
      </div>
    </article>
  )
}
