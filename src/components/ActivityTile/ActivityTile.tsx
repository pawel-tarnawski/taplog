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
const LONG_PRESS_MS = 500

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

interface TileMenuProps {
  onRename: () => void
  onReset: () => void
  onDelete: () => void
  positionClass: string
}

function TileMenu({ onRename, onReset, onDelete, positionClass }: TileMenuProps) {
  return (
    <ul
      role="menu"
      className={`absolute z-10 min-w-[130px] overflow-hidden rounded-lg bg-sidebar shadow-lg ${positionClass}`}
      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <li>
        <button
          role="menuitem"
          onClick={(e) => { e.stopPropagation(); onRename() }}
          className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-primary transition-colors hover:bg-white/5"
        >
          Rename
        </button>
      </li>
      <li>
        <button
          role="menuitem"
          onClick={(e) => { e.stopPropagation(); onReset() }}
          className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-primary transition-colors hover:bg-white/5"
        >
          Reset tile
        </button>
      </li>
      <li>
        <button
          role="menuitem"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-danger transition-colors hover:bg-white/5"
        >
          Delete
        </button>
      </li>
    </ul>
  )
}

function ActivityTileImpl({ activity, tileWidth, tileHeight, onEdit }: Props) {
  const toggleTimer    = useTaplogStore((s) => s.toggleTimer)
  const resetActivity  = useTaplogStore((s) => s.resetActivity)
  const deleteActivity = useTaplogStore((s) => s.deleteActivity)

  const [menuOpen, setMenuOpen] = useState(false)
  // Two refs because the menu's positioned ancestor differs between micro
  // (the whole <article>) and full (the <div> wrapping the ⋯ button).
  const microRef = useRef<HTMLElement>(null)
  const fullMenuRef = useRef<HTMLDivElement>(null)

  // Long-press state — used on the micro tile (which has no ⋯ button).
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)

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
      const target = e.target as Node
      const inMicro = microRef.current?.contains(target) ?? false
      const inFull = fullMenuRef.current?.contains(target) ?? false
      if (!inMicro && !inFull) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  function handleMenuAction(action: () => void) {
    action()
    setMenuOpen(false)
  }

  function startLongPress() {
    longPressFiredRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true
      setMenuOpen(true)
    }, LONG_PRESS_MS)
  }

  function cancelLongPress() {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const ariaLabel = activity.isRunning
    ? `Stop tracking ${activity.name}`
    : `Start tracking ${activity.name}`

  // ── Micro tile: whole tile is the tap target, badge only ─────────────────
  // Raised from 120 → 160: anything below feels cramped with the full layout.
  // Micro tiles have no ⋯ button — use long-press (or Shift+F10 / ContextMenu
  // key on a keyboard) to open the actions menu.
  const isMicro = tileWidth > 0 && tileHeight > 0 && Math.min(tileWidth, tileHeight) < 160
  if (isMicro) {
    const dim = Math.min(tileWidth, tileHeight)
    const labelSize = Math.max(8, Math.round(dim * 0.22))
    const label = activity.code
    return (
      <article
        ref={microRef}
        role="button"
        tabIndex={0}
        aria-pressed={activity.isRunning}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        onClick={(e) => {
          if (longPressFiredRef.current) {
            // Long-press just opened the menu — swallow the trailing click.
            e.preventDefault()
            longPressFiredRef.current = false
            return
          }
          if (menuOpen) {
            // Tap on the tile (outside the menu) while the menu is open: close it without toggling.
            setMenuOpen(false)
            return
          }
          toggleTimer(activity.id)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
            e.preventDefault()
            setMenuOpen(true)
            return
          }
          if (e.key === 'Escape' && menuOpen) {
            e.preventDefault()
            setMenuOpen(false)
            return
          }
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleTimer(activity.id)
          }
        }}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onContextMenu={(e) => e.preventDefault()}
        className={['relative rounded-lg cursor-pointer select-none transition-all duration-200', activity.isRunning ? 'animate-tile-pulse' : ''].join(' ')}
        style={{
          border: `${borderWidth} solid ${borderColor}`,
          backgroundColor: 'var(--bg-tile)',
          '--tile-glow-dim':    `0 0 24px ${hexToRgba(color, 0.45)}`,
          '--tile-glow-bright': `0 0 48px ${hexToRgba(color, 0.75)}`,
          touchAction: 'manipulation',
        } as React.CSSProperties}
        title={activity.name}
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit]">
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
        {menuOpen && (
          <TileMenu
            onRename={() => handleMenuAction(() => onEdit(activity))}
            onReset={() => handleMenuAction(() => resetActivity(activity.id))}
            onDelete={() => handleMenuAction(() => deleteActivity(activity.id))}
            positionClass="right-0 top-full mt-1"
          />
        )}
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

        <div ref={fullMenuRef} className="relative shrink-0">
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
            <TileMenu
              onRename={() => handleMenuAction(() => onEdit(activity))}
              onReset={() => handleMenuAction(() => resetActivity(activity.id))}
              onDelete={() => handleMenuAction(() => deleteActivity(activity.id))}
              positionClass="right-0 top-full mt-1"
            />
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
