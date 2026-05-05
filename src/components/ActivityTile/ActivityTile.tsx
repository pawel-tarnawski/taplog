import { useState, useEffect, useRef } from 'react'
import type { Activity } from '../../types'
import { useTaplogStore } from '../../store/taplogStore'
import { formatMs } from '../../utils/time'

interface Props {
  activity: Activity
}

export function ActivityTile({ activity }: Props) {
  const toggleTimer = useTaplogStore((s) => s.toggleTimer)
  const renameActivity = useTaplogStore((s) => s.renameActivity)
  const resetActivity = useTaplogStore((s) => s.resetActivity)
  const deleteActivity = useTaplogStore((s) => s.deleteActivity)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(activity.name)
  const [menuOpen, setMenuOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const displayMs =
    activity.accumulatedMs +
    (activity.isRunning && activity.startedAt !== null ? Date.now() - activity.startedAt : 0)

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
    if (trimmed && trimmed !== activity.name) renameActivity(activity.id, trimmed)
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
        'relative flex flex-col items-center gap-3 rounded-xl border p-4 transition-all duration-200',
        activity.isRunning
          ? 'border-accent bg-tile animate-tile-pulse'
          : 'border-transparent bg-tile hover:bg-tile-hover',
      ].join(' ')}
    >
      {/* Name row + options menu */}
      <div className="flex w-full items-center justify-between gap-2">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            aria-label="Rename activity"
            className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm font-medium text-primary outline-none ring-1 ring-accent"
          />
        ) : (
          <h2
            className="min-w-0 flex-1 cursor-default truncate text-sm font-medium text-primary"
            onDoubleClick={startEditing}
            title={`${activity.name} — double-click to rename`}
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
            className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:text-primary"
          >
            ⋯
          </button>

          {menuOpen && (
            <ul
              role="menu"
              className="absolute right-0 top-full z-10 mt-1 min-w-[130px] overflow-hidden rounded-lg border border-white/10 bg-sidebar shadow-lg"
            >
              <li>
                <button
                  role="menuitem"
                  onClick={() => handleMenuAction(startEditing)}
                  className="w-full px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-white/5"
                >
                  Rename
                </button>
              </li>
              <li>
                <button
                  role="menuitem"
                  onClick={() => handleMenuAction(() => resetActivity(activity.id))}
                  className="w-full px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-white/5"
                >
                  Reset tile
                </button>
              </li>
              <li>
                <button
                  role="menuitem"
                  onClick={() => handleMenuAction(() => deleteActivity(activity.id))}
                  className="w-full px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-white/5"
                >
                  Delete
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Timer */}
      <div
        className="font-mono text-2xl tracking-widest text-primary"
        aria-label={`Timer: ${formatMs(displayMs)}`}
      >
        {formatMs(displayMs)}
      </div>

      {/* Running text indicator — always in DOM for stable height */}
      <span
        className={`text-xs font-medium transition-colors ${
          activity.isRunning ? 'text-accent' : 'text-transparent select-none'
        }`}
        aria-hidden="true"
      >
        ● Running
      </span>

      {/* Toggle button — primary tap target */}
      <button
        onClick={() => toggleTimer(activity.id)}
        aria-pressed={activity.isRunning}
        aria-label={activity.isRunning ? `Pause ${activity.name}` : `Start ${activity.name}`}
        className={[
          'flex h-20 w-20 min-h-[80px] min-w-[80px] items-center justify-center rounded-full text-2xl',
          'transition-all duration-200 active:scale-95',
          activity.isRunning
            ? 'bg-accent/20 text-accent hover:bg-accent/30'
            : 'bg-white/10 text-primary hover:bg-white/15',
        ].join(' ')}
      >
        {activity.isRunning ? '⏸' : '▶'}
      </button>
    </article>
  )
}
