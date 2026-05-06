import { useState, useRef, useLayoutEffect } from 'react'
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

  // Before container is measured, use sqrt heuristic so there are no implicit rows
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
    const score = Math.max(cellW / cellH, cellH / cellW) // 1 = perfect square
    if (score < bestScore) {
      bestScore = score
      bestCols = cols
    }
  }

  return { cols: bestCols, rows: Math.ceil(count / bestCols) }
}

export function TileGrid() {
  const activities = useTaplogStore((s) => s.activities)
  const addActivity = useTaplogStore((s) => s.addActivity)
  const renameActivity = useTaplogStore((s) => s.renameActivity)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // useLayoutEffect fires before the browser paints — we get the real size on the
  // very first render so there is no flash of wrong cols/rows.
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

  const totalItems = activities.length + 2 // +PauseTile +AddButton
  const { cols, rows } = computeGridLayout(totalItems, containerSize.width, containerSize.height)

  const tileWidth  = cols > 0 ? (containerSize.width  - (cols - 1) * GAP) / cols : 0
  const tileHeight = rows > 0 ? (containerSize.height - (rows - 1) * GAP) / rows : 0

  const minDim = Math.min(tileWidth || 160, tileHeight || 160)
  const addPlusSize  = Math.max(20, Math.round(minDim * 0.18))
  const addLabelSize = Math.max(10, Math.round(minDim * 0.07))

  return (
    <div ref={containerRef} className="h-full w-full">
      <div
        className="grid h-full gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows:    `repeat(${rows}, 1fr)`,
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

        <button
          ref={addBtnRef}
          onClick={() => setAddModalOpen(true)}
          aria-label="Add activity"
          className="flex flex-col items-center justify-center gap-2 rounded-xl text-muted transition-colors hover:text-primary"
          style={{ border: '1px dashed rgba(255,255,255,0.18)' }}
        >
          <PlusIcon size={addPlusSize} />
          <span style={{ fontSize: addLabelSize }} className="font-medium">
            Add activity
          </span>
        </button>
      </div>

      {addModalOpen && (
        <AddActivityModal
          onClose={() => setAddModalOpen(false)}
          onConfirm={addActivity}
          triggerRef={addBtnRef}
        />
      )}

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
