import { useState, useEffect, useRef } from 'react'
import type { Activity } from '../../types'
import { useTaplogStore } from '../../store/taplogStore'
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

/** All sizes derived from the tile's usable inner area and label length. */
function tileScale(tileWidth: number, tileHeight: number, labelLen: number) {
  const d = Math.max(40, Math.min(
    (tileWidth  || 160) - TILE_PAD,
    (tileHeight || 160) - TILE_PAD,
  ))
  // Name font scales down for long labels so text stays readable in 2 lines
  const rawName = Math.min(Math.round(d * 0.115), 52)
  const lenFactor = labelLen > 10 ? Math.max(0.6, 10 / labelLen) : 1
  return {
    btnSize:     Math.max(44,  Math.min(Math.round(d * 0.52), 200)),
    iconSize:    Math.max(18,  Math.min(Math.round(d * 0.22),  88)),
    nameSize:    Math.max(12,  Math.round(rawName * lenFactor)),
    timerSize:   Math.max(10,  Math.min(Math.round(d * 0.09),  40)),
    dotSize:     Math.max(9,   Math.min(Math.round(d * 0.06),  18)),
    menuBtnSize: Math.max(48,  Math.min(Math.round(d * 0.22),  72)),
  }
}

export function ActivityTile({ activity, tileWidth, tileHeight, onEdit }: Props) {
  const toggleTimer  = useTaplogStore((s) => s.toggleTimer)
  const resetActivity = useTaplogStore((s) => s.resetActivity)
  const deleteActivity = useTaplogStore((s) => s.deleteActivity)
  const renameActivity = useTaplogStore((s) => s.renameActivity)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue]     = useState(activity.name)
  const [menuOpen, setMenuOpen]       = useState(false)

  const menuRef     = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const displayMs =
    activity.accumulatedMs +
    (activity.isRunning && activity.startedAt !== null ? Date.now() - activity.startedAt : 0)

  const d = Math.max(40, Math.min((tileWidth || 160) - TILE_PAD, (tileHeight || 160) - TILE_PAD))
  // Secondary name visible when tile has enough room; hidden on small/cramped tiles
  const showSecondaryName = !!(activity.code && d >= 90)
  const secondaryNameSize = Math.max(9, Math.min(Math.round(d * 0.075), 13))

  const { btnSize, iconSize, nameSize, timerSize, dotSize, menuBtnSize } =
    tileScale(tileWidth, tileHeight, activity.code ? activity.code.length : activity.name.length)

  const color    = activity.color
  const glowDim    = hexToRgba(color, 0.45)
  const glowBright = hexToRgba(color, 0.75)
  const borderColor = activity.isRunning ? color : hexToRgba(color, 0.28)
  const borderWidth = activity.isRunning ? '2px' : '1px'
  const btnBg      = activity.isRunning ? hexToRgba(color, 0.22) : hexToRgba(color, 0.12)

  useEffect(() => {
    if (!editingName) setNameValue(activity.name)
  }, [activity.name, editingName])

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  useEffect(() => {
    if (!menuOpen) return
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [menuOpen])

  function startEditing() {
    setNameValue(activity.name)
    setEditingName(true)
    setMenuOpen(false)
  }

  function commitName() {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== activity.name) renameActivity(activity.id, trimmed, activity.code)
    setNameValue(trimmed || activity.name)
    setEditingName(false)
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')  commitName()
    if (e.key === 'Escape') { setNameValue(activity.name); setEditingName(false) }
  }

  function handleMenuAction(action: () => void) {
    action()
    setMenuOpen(false)
  }

  return (
    <article
      className={[
        'relative flex flex-col items-center justify-between overflow-hidden rounded-xl p-3',
        'transition-all duration-200',
        activity.isRunning ? 'animate-tile-pulse' : '',
      ].join(' ')}
      style={{
        border: `${borderWidth} solid ${borderColor}`,
        backgroundColor: 'var(--bg-tile)',
        '--tile-glow-dim':    `0 0 24px ${glowDim}`,
        '--tile-glow-bright': `0 0 48px ${glowBright}`,
      } as React.CSSProperties}
    >
      {/* ── Top row: name + menu ───────────────────────────────────────── */}
      <div className="flex w-full items-start justify-between gap-1">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            aria-label="Rename activity"
            className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 font-semibold text-primary outline-none ring-1"
            style={{ fontSize: nameSize, '--tw-ring-color': color } as React.CSSProperties}
          />
        ) : activity.code ? (
          <div className="flex min-w-0 flex-col" style={{ gap: Math.max(2, Math.round(nameSize * 0.2)) }}>
            <span
              className="self-start rounded-md font-mono font-bold leading-none"
              style={{
                fontSize: nameSize,
                color,
                background: hexToRgba(color, 0.2),
                padding: `${Math.max(2, Math.round(nameSize * 0.2))}px ${Math.max(4, Math.round(nameSize * 0.38))}px`,
              }}
              onDoubleClick={startEditing}
              title={activity.name}
            >
              {activity.code}
            </span>
            {showSecondaryName && (
              <span
                className="min-w-0 truncate text-muted"
                style={{ fontSize: secondaryNameSize }}
                title={activity.name}
              >
                {activity.name}
              </span>
            )}
          </div>
        ) : (
          <h2
            className="min-w-0 flex-1 cursor-default break-words font-bold leading-tight text-primary line-clamp-2"
            style={{ fontSize: nameSize }}
            onDoubleClick={startEditing}
            title={activity.name}
          >
            {activity.name}
          </h2>
        )}

        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
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
                  onClick={() => handleMenuAction(() => onEdit(activity))}
                  className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-primary transition-colors hover:bg-white/5"
                >
                  Rename
                </button>
              </li>
              <li>
                <button
                  role="menuitem"
                  onClick={() => handleMenuAction(() => resetActivity(activity.id))}
                  className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-primary transition-colors hover:bg-white/5"
                >
                  Reset tile
                </button>
              </li>
              <li>
                <button
                  role="menuitem"
                  onClick={() => handleMenuAction(() => deleteActivity(activity.id))}
                  className="flex min-h-[48px] w-full items-center px-3 text-left text-sm text-danger transition-colors hover:bg-white/5"
                >
                  Delete
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* ── Central toggle button ──────────────────────────────────────── */}
      <button
        onClick={() => toggleTimer(activity.id)}
        aria-pressed={activity.isRunning}
        aria-label={
          activity.isRunning
            ? `Stop tracking ${activity.name}`
            : `Start tracking ${activity.name}`
        }
        className="flex shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95"
        style={{
          width:    btnSize,
          height:   btnSize,
          minWidth:  80,
          minHeight: 80,
          background: btnBg,
        }}
      >
        {activity.isRunning
          ? <PauseIcon size={iconSize} color={color} />
          : <PlayIcon  size={iconSize} color={color} />}
      </button>

      {/* ── Bottom: tracking indicator + timer ─────────────────────────── */}
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
