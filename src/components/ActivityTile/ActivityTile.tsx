import { useState, useEffect, useRef } from 'react'
import type { Activity } from '../../types'
import { useTaplogStore } from '../../store/taplogStore'
import { formatMs } from '../../utils/time'
import { hexToRgba } from '../../utils/color'

interface Props {
  activity: Activity
  tileWidth: number
  onEdit: (activity: Activity) => void
}

export function ActivityTile({ activity, tileWidth, onEdit }: Props) {
  const toggleTimer = useTaplogStore((s) => s.toggleTimer)
  const resetActivity = useTaplogStore((s) => s.resetActivity)
  const deleteActivity = useTaplogStore((s) => s.deleteActivity)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(activity.name)
  const [menuOpen, setMenuOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const renameActivity = useTaplogStore((s) => s.renameActivity)

  const displayMs =
    activity.accumulatedMs +
    (activity.isRunning && activity.startedAt !== null ? Date.now() - activity.startedAt : 0)

  const showCode = !!(activity.code && tileWidth > 0 && tileWidth < 150)
  const displayLabel = showCode ? activity.code! : activity.name

  const color = activity.color
  const glowDim = hexToRgba(color, 0.3)
  const glowBright = hexToRgba(color, 0.55)
  const borderColor = activity.isRunning ? color : hexToRgba(color, 0.28)
  const borderWidth = activity.isRunning ? '2px' : '1px'
  const btnBg = activity.isRunning ? hexToRgba(color, 0.22) : hexToRgba(color, 0.12)

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
    if (e.key === 'Enter') commitName()
    if (e.key === 'Escape') {
      setNameValue(activity.name)
      setEditingName(false)
    }
  }

  function handleMenuAction(action: () => void) {
    action()
    setMenuOpen(false)
  }

  return (
    <article
      className={[
        'relative flex flex-col items-center justify-between rounded-xl p-3 transition-all duration-200',
        activity.isRunning ? 'animate-tile-pulse' : '',
      ].join(' ')}
      style={{
        border: `${borderWidth} solid ${borderColor}`,
        backgroundColor: 'var(--bg-tile)',
        '--tile-glow-dim': `0 0 18px ${glowDim}`,
        '--tile-glow-bright': `0 0 32px ${glowBright}`,
      } as React.CSSProperties}
    >
      {/* Top row: name + menu */}
      <div className="flex w-full items-start justify-between gap-1">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            aria-label="Rename activity"
            className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm font-semibold text-primary outline-none ring-1"
            style={{ '--tw-ring-color': color } as React.CSSProperties}
          />
        ) : (
          <h2
            className="min-w-0 flex-1 cursor-default truncate text-sm font-semibold leading-tight text-primary"
            onDoubleClick={startEditing}
            title={activity.name}
          >
            {displayLabel}
          </h2>
        )}

        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Activity options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-12 w-12 items-center justify-center rounded text-muted transition-colors hover:text-primary"
          >
            ⋯
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

      {/* Central toggle button */}
      <button
        onClick={() => toggleTimer(activity.id)}
        aria-pressed={activity.isRunning}
        aria-label={activity.isRunning ? `Stop tracking ${activity.name}` : `Start tracking ${activity.name}`}
        className="flex h-20 w-20 min-h-[80px] min-w-[80px] items-center justify-center rounded-full text-2xl transition-all duration-200 active:scale-95"
        style={{ background: btnBg, color }}
      >
        {activity.isRunning ? '⏸' : '▶'}
      </button>

      {/* Bottom: tracking indicator + timer */}
      <div className="flex w-full flex-col items-center gap-0.5">
        <span
          className="text-xs font-medium transition-colors"
          style={{ color: activity.isRunning ? color : 'transparent' }}
          aria-hidden="true"
        >
          ● Tracking
        </span>
        <div
          className="font-mono text-lg tracking-widest text-primary"
          aria-label={`Timer: ${formatMs(displayMs)}`}
        >
          {formatMs(displayMs)}
        </div>
      </div>
    </article>
  )
}
