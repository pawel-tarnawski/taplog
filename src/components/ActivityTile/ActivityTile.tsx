import { memo, useState, useEffect, useRef } from 'react'
import type { Activity } from '../../types'
import { useTaplogStore } from '../../store/taplogStore'
import { useTick } from '../../hooks/useTick'
import { formatMs } from '../../utils/time'
import { hexToRgba } from '../../utils/color'
import { PlayIcon, PauseIcon, DotsIcon } from '../icons'

interface Props {
  activity: Activity
  tileWidth: number
  tileHeight: number
  onEdit: (activity: Activity) => void
}

const TILE_PAD = 24 // p-3 = 12 px × 2 sides

function tileScale(tileWidth: number, tileHeight: number, labelLen: number) {
  const d = Math.max(40, Math.min(
    (tileWidth  || 160) - TILE_PAD,
    (tileHeight || 160) - TILE_PAD,
  ))
  const rawName = Math.min(Math.round(d * 0.115), 52)
  const lenFactor = labelLen > 10 ? Math.max(0.6, 10 / labelLen) : 1
  return {
    btnSize:     Math.max(44,  Math.min(Math.round(d * 0.52), 200)),
    iconSize:    Math.max(18,  Math.min(Math.round(d * 0.22),  88)),
    nameSize:    Math.max(12,  Math.round(rawName * lenFactor)),
    timerSize:   Math.max(10,  Math.min(Math.round(d * 0.09),  40)),
    dotSize:     Math.max(9,   Math.min(Math.round(d * 0.06),  18)),
    menuBtnSize: Math.max(44,  Math.min(Math.round(d * 0.22),  72)),
  }
}

function ActivityTileImpl({ activity, tileWidth, tileHeight, onEdit }: Props) {
  const toggleTimer    = useTaplogStore((s) => s.toggleTimer)
  const resetActivity  = useTaplogStore((s) => s.resetActivity)
  const deleteActivity = useTaplogStore((s) => s.deleteActivity)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Only the running tile re-renders each second.
  useTick(activity.isRunning ? 1000 : null)

  const displayMs =
    activity.accumulatedMs +
    (activity.isRunning && activity.startedAt !== null ? Date.now() - activity.startedAt : 0)

  const d = Math.max(40, Math.min((tileWidth || 160) - TILE_PAD, (tileHeight || 160) - TILE_PAD))
  const secondaryNameSize = Math.max(9, Math.min(Math.round(d * 0.075), 13))

  const { btnSize, iconSize, nameSize, timerSize, dotSize, menuBtnSize } =
    tileScale(tileWidth, tileHeight, activity.code.length)

  const color      = activity.color
  const glowDim    = hexToRgba(color, 0.45)
  const glowBright = hexToRgba(color, 0.75)
  const borderColor = activity.isRunning ? color : hexToRgba(color, 0.28)
  const borderWidth = activity.isRunning ? '2px' : '1px'
  const btnBg       = activity.isRunning ? hexToRgba(color, 0.22) : hexToRgba(color, 0.12)

  useEffect(() => {
    if (!menuOpen) return
    // pointerdown covers mouse, touch, and pen — `mousedown` alone misses taps
    // on some Android Chromium builds, so the menu wouldn't dismiss outside it.
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  function handleMenuAction(action: () => void) {
    action()
    setMenuOpen(false)
  }

  const ariaLabel = activity.isRunning
    ? `Stop tracking ${activity.name}`
    : `Start tracking ${activity.name}`

  // ── Micro tile: whole tile is the tap target, badge only ─────────────────
  // Raised from 120 → 160: anything below feels cramped with the full layout
  // (badge + ⋯ + central indicator + tracking dot + timer all sharing space).
  const isMicro = tileWidth > 0 && tileHeight > 0 && Math.min(tileWidth, tileHeight) < 160
  if (isMicro) {
    const dim = Math.min(tileWidth, tileHeight)
    const labelSize = Math.max(8, Math.round(dim * 0.22))
    const label = activity.code
    return (
      <article
        role="button"
        tabIndex={0}
        aria-pressed={activity.isRunning}
        aria-label={ariaLabel}
        onClick={() => toggleTimer(activity.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTimer(activity.id) } }}
        className={['relative overflow-hidden rounded-lg cursor-pointer select-none transition-all duration-200', activity.isRunning ? 'animate-tile-pulse' : ''].join(' ')}
        style={{
          border: `${borderWidth} solid ${borderColor}`,
          backgroundColor: 'var(--bg-tile)',
          '--tile-glow-dim':    `0 0 24px ${hexToRgba(color, 0.45)}`,
          '--tile-glow-bright': `0 0 48px ${hexToRgba(color, 0.75)}`,
        } as React.CSSProperties}
        title={activity.name}
      >
        <div className="flex h-full w-full items-center justify-center">
          <span
            className="rounded font-mono font-bold leading-none"
            style={{
              fontSize: labelSize,
              color,
              background: hexToRgba(color, 0.2),
              padding: `${Math.max(1, Math.round(labelSize * 0.2))}px ${Math.max(2, Math.round(labelSize * 0.35))}px`,
            }}
          >
            {label}
          </span>
        </div>
      </article>
    )
  }

  // ── Normal tile: whole article is the tap target; ⋯ uses stopPropagation ──
  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={activity.isRunning}
      aria-label={ariaLabel}
      onClick={() => toggleTimer(activity.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTimer(activity.id) } }}
      className={[
        'relative flex flex-col items-center justify-between overflow-hidden rounded-xl p-3',
        'cursor-pointer select-none transition-all duration-200',
        activity.isRunning ? 'animate-tile-pulse' : '',
      ].join(' ')}
      style={{
        border: `${borderWidth} solid ${borderColor}`,
        backgroundColor: 'var(--bg-tile)',
        '--tile-glow-dim':    `0 0 24px ${glowDim}`,
        '--tile-glow-bright': `0 0 48px ${glowBright}`,
      } as React.CSSProperties}
    >
      {/* ── Top row: badge + name + ⋯ menu ────────────────────────────────── */}
      <div className="flex w-full items-start justify-between gap-1">
        <div className="flex min-w-0 flex-col" style={{ gap: Math.max(2, Math.round(nameSize * 0.2)) }}>
          <span
            className="self-start rounded-md font-mono font-bold leading-none"
            style={{
              fontSize: nameSize,
              color,
              background: hexToRgba(color, 0.2),
              padding: `${Math.max(2, Math.round(nameSize * 0.2))}px ${Math.max(4, Math.round(nameSize * 0.38))}px`,
            }}
            title={activity.name}
          >
            {activity.code}
          </span>
          <span
            className="min-w-0 truncate text-muted"
            style={{ fontSize: secondaryNameSize }}
            title={activity.name}
          >
            {activity.name}
          </span>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
            aria-label="Activity options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex shrink-0 items-center justify-center rounded transition-colors text-muted hover:text-primary"
            style={{ width: menuBtnSize, height: menuBtnSize }}
          >
            <DotsIcon size={Math.round(menuBtnSize * 0.5)} color="currentColor" />
          </button>

          {menuOpen && (
            <ul
              role="menu"
              className="absolute right-0 top-full z-10 mt-1 min-w-[130px] overflow-hidden rounded-lg bg-sidebar shadow-lg"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <li>
                <button
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); handleMenuAction(() => onEdit(activity)) }}
                  className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-primary transition-colors hover:bg-white/5"
                >
                  Rename
                </button>
              </li>
              <li>
                <button
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); handleMenuAction(() => resetActivity(activity.id)) }}
                  className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-primary transition-colors hover:bg-white/5"
                >
                  Reset tile
                </button>
              </li>
              <li>
                <button
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); handleMenuAction(() => deleteActivity(activity.id)) }}
                  className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-danger transition-colors hover:bg-white/5"
                >
                  Delete
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* ── Central visual indicator (not interactive — tile is the tap target) ── */}
      <div
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-full transition-all duration-200"
        style={{ width: btnSize, height: btnSize, background: btnBg }}
      >
        {activity.isRunning
          ? <PauseIcon size={iconSize} color={color} />
          : <PlayIcon  size={iconSize} color={color} />}
      </div>

      {/* ── Bottom: tracking indicator + timer ─────────────────────────────── */}
      <div className="flex w-full flex-col items-center">
        <span
          className="font-medium transition-colors"
          style={{ fontSize: dotSize, color: activity.isRunning ? color : 'transparent' }}
          aria-hidden="true"
        >
          ● Tracking
        </span>
        <div
          className="font-mono font-medium tracking-widest text-primary"
          style={{ fontSize: timerSize }}
          aria-label={`Timer: ${formatMs(displayMs)}`}
        >
          {formatMs(displayMs)}
        </div>
      </div>
    </article>
  )
}

export const ActivityTile = memo(ActivityTileImpl)
