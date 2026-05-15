import { useState, useRef, useLayoutEffect, useMemo } from 'react'
import { useTaplogStore } from '../../store/taplogStore'
import { ActivityTile } from '../ActivityTile'
import { PauseTile } from '../PauseTile'
import { AddActivityModal } from '../AddActivityModal'
import { PlusIcon } from '../icons'
import type { Activity } from '../../types'

const GAP = 12 // gap-3 = 12px

function computeGridLayout(
  count: number,
  containerWidth: number,
  containerHeight: number,
): { cols: number; rows: number } {
  if (count <= 0) return { cols: 1, rows: 1 }

  const fallbackCols = Math.max(1, Math.ceil(Math.sqrt(count)))
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { cols: fallbackCols, rows: Math.ceil(count / fallbackCols) }
  }

  let bestCols = fallbackCols
  let bestScore = Infinity

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const cellW = (containerWidth - (cols - 1) * GAP) / cols
    const cellH = (containerHeight - (rows - 1) * GAP) / rows
    if (cellW <= 0 || cellH <= 0) continue
    const score = Math.max(cellW / cellH, cellH / cellW)
    if (score < bestScore) {
      bestScore = score
      bestCols = cols
    }
  }

  return { cols: bestCols, rows: Math.ceil(count / bestCols) }
}

interface Props {
  onAddActivity: () => void
}

export function TileGrid({ onAddActivity }: Props) {
  const activities = useTaplogStore((s) => s.activities)
  const renameActivity = useTaplogStore((s) => s.renameActivity)

  const [editActivity, setEditActivity] = useState<Activity | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setContainerSize({ width: rect.width, height: rect.height })
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainerSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Grid layout (computed unconditionally so hook order is stable) ──────
  const totalItems = activities.length + 1 // +PauseTile
  const { cols, rows } = useMemo(
    () => computeGridLayout(totalItems, containerSize.width, containerSize.height),
    [totalItems, containerSize.width, containerSize.height],
  )

  // ── Empty state ──────────────────────────────────────────────────────────
  if (activities.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <button
          onClick={onAddActivity}
          aria-label="Add activity"
          className="flex flex-col items-center gap-4 rounded-2xl px-12 py-10 text-muted transition-colors hover:text-primary"
          style={{ border: '1px dashed rgba(255,255,255,0.15)' }}
        >
          <PlusIcon size={56} />
          <span className="text-base font-medium">Add your first activity</span>
        </button>
      </div>
    )
  }

  const tileWidth  = cols > 0 ? (containerSize.width  - (cols - 1) * GAP) / cols : 0
  const tileHeight = rows > 0 ? (containerSize.height - (rows - 1) * GAP) / rows : 0

  return (
    <div ref={containerRef} className="h-full w-full">
      <div
        className="grid h-full gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows:    `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {activities.map((activity) => (
          <ActivityTile
            key={activity.id}
            activity={activity}
            tileWidth={tileWidth}
            tileHeight={tileHeight}
            onEdit={setEditActivity}
          />
        ))}

        <PauseTile tileWidth={tileWidth} tileHeight={tileHeight} />
      </div>

      {editActivity && (
        <AddActivityModal
          onClose={() => setEditActivity(null)}
          onConfirm={(name, code) => renameActivity(editActivity.id, name, code)}
          initialName={editActivity.name}
          initialCode={editActivity.code ?? ''}
          title="Edit activity"
          confirmLabel="Save"
        />
      )}
    </div>
  )
}
