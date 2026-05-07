import { useTaplogStore } from '../../store/taplogStore'
import { hexToRgba } from '../../utils/color'
import { PAUSE_COLOR } from '../../utils/tileColors'
import { PauseIcon } from '../icons'

interface Props {
  tileWidth?: number
  tileHeight?: number
}

const TILE_PAD = 24

function pauseScale(w: number, h: number) {
  const d = Math.max(40, Math.min((w || 160) - TILE_PAD, (h || 160) - TILE_PAD))
  return {
    btnSize:  Math.max(44, Math.min(Math.round(d * 0.52), 200)),
    iconSize: Math.max(18, Math.min(Math.round(d * 0.22),  88)),
    nameSize: Math.max(12, Math.min(Math.round(d * 0.115), 52)),
    dotSize:  Math.max(9,  Math.min(Math.round(d * 0.06),  18)),
  }
}

export function PauseTile({ tileWidth = 0, tileHeight = 0 }: Props) {
  const activities = useTaplogStore((s) => s.activities)
  const toggleTimer = useTaplogStore((s) => s.toggleTimer)

  const runningActivity = activities.find((a) => a.isRunning) ?? null
  const isIdle = runningActivity === null

  const { btnSize, iconSize, nameSize, dotSize } = pauseScale(tileWidth, tileHeight)

  const glowDim    = hexToRgba(PAUSE_COLOR, 0.45)
  const glowBright = hexToRgba(PAUSE_COLOR, 0.75)

  // ── Micro tile ────────────────────────────────────────────────────────────
  const isMicro = tileWidth > 0 && tileHeight > 0 && (tileHeight < 100 || tileWidth < 60)
  if (isMicro) {
    const dim = Math.min(tileWidth, tileHeight)
    return (
      <article
        className={['relative overflow-hidden rounded-lg transition-all duration-200', isIdle ? 'animate-tile-pulse' : ''].join(' ')}
        style={{
          border: `${isIdle ? '2px' : '1px'} solid ${isIdle ? PAUSE_COLOR : hexToRgba(PAUSE_COLOR, 0.28)}`,
          backgroundColor: 'var(--bg-tile)',
          '--tile-glow-dim':    `0 0 24px ${glowDim}`,
          '--tile-glow-bright': `0 0 48px ${glowBright}`,
        } as React.CSSProperties}
      >
        <button
          onClick={() => runningActivity && toggleTimer(runningActivity.id)}
          disabled={isIdle}
          aria-label="Pause tracking"
          aria-pressed={isIdle}
          className="flex h-full w-full items-center justify-center disabled:cursor-default"
        >
          <PauseIcon size={Math.max(10, Math.round(dim * 0.38))} color={PAUSE_COLOR} />
        </button>
      </article>
    )
  }

  return (
    <article
      className={[
        'relative flex flex-col items-center justify-between overflow-hidden rounded-xl p-3',
        'transition-all duration-200',
        isIdle ? 'animate-tile-pulse' : '',
      ].join(' ')}
      style={{
        border: `${isIdle ? '2px' : '1px'} solid ${isIdle ? PAUSE_COLOR : hexToRgba(PAUSE_COLOR, 0.28)}`,
        backgroundColor: 'var(--bg-tile)',
        '--tile-glow-dim':    `0 0 24px ${glowDim}`,
        '--tile-glow-bright': `0 0 48px ${glowBright}`,
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
          width:    btnSize,
          height:   btnSize,
          background: hexToRgba(PAUSE_COLOR, isIdle ? 0.22 : 0.1),
        }}
      >
        <PauseIcon size={iconSize} color={PAUSE_COLOR} />
      </button>

      {/* Bottom status — mirrors ActivityTile layout for visual alignment */}
      <div className="flex w-full flex-col items-center">
        <span
          className="font-medium"
          style={{ fontSize: dotSize, color: isIdle ? PAUSE_COLOR : 'transparent' }}
          aria-hidden="true"
        >
          ● Nothing tracked
        </span>
        <div
          className="font-mono font-medium text-transparent select-none"
          style={{ fontSize: Math.max(10, Math.round(Math.min((tileWidth || 160) - TILE_PAD, (tileHeight || 160) - TILE_PAD) * 0.09)) }}
        >
          00:00:00
        </div>
      </div>
    </article>
  )
}
