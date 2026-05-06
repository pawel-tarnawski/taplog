import { useState, useRef, useEffect } from 'react'
import { useTaplogStore } from '../../store/taplogStore'
import { ActivityTile } from '../ActivityTile'
import { PauseTile } from '../PauseTile'
import { AddActivityModal } from '../AddActivityModal'
import type { Activity } from '../../types'

const GAP = 12 // gap-3 = 12px

function computeGridLayout(
  count: number,
  containerWidth: number,
  containerHeight: number,
): { cols: number; rows: number } {
  if (count <= 0 || containerWidth <= 0 || containerHeight <= 0) return { cols: 1, rows: 1 }

  const MIN_CELL = 140
  let bestCols = Math.max(1, Math.ceil(Math.sqrt(count)))
  let bestScore = Infinity

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const cellW = (containerWidth - (cols - 1) * GAP) / cols
    const cellH = (containerHeight - (rows - 1) * GAP) / rows
    if (cellW < MIN_CELL || cellH < MIN_CELL) continue
    const score = Math.max(cellW / cellH, cellH / cellW)
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

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainerSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const totalItems = activities.length + 2
  const { cols, rows } = computeGridLayout(totalItems, containerSize.width, containerSize.height)

  // Actual cell dimensions (accounting for gap)
  const tileWidth = cols > 0 ? (containerSize.width - (cols - 1) * GAP) / cols : 0
  const tileHeight = rows > 0 ? (containerSize.height - (rows - 1) * GAP) / rows : 0

  // Scale "+" add button text with tile size
  const minDim = Math.min(tileWidth || 200, tileHeight || 200)
  const addPlusSize = Math.max(24, Math.round(minDim * 0.18))
  const addLabelSize = Math.max(11, Math.round(minDim * 0.07))

  return (
    <div ref={containerRef} className="h-full w-full">
      <div
        className="grid h-full gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
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
          <span style={{ fontSize: addPlusSize, lineHeight: 1 }}>+</span>
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
