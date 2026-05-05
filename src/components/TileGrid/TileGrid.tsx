import { useState, useRef } from 'react'
import { useTaplogStore } from '../../store/taplogStore'
import { ActivityTile } from '../ActivityTile'
import { AddActivityModal } from '../AddActivityModal'

export function TileGrid() {
  const activities = useTaplogStore((s) => s.activities)
  const [modalOpen, setModalOpen] = useState(false)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
      >
        {activities.map((activity) => (
          <ActivityTile key={activity.id} activity={activity} />
        ))}

        <button
          ref={addBtnRef}
          onClick={() => setModalOpen(true)}
          aria-label="Add activity"
          className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 text-muted transition-colors hover:border-accent/50 hover:text-accent"
        >
          <span className="text-3xl leading-none">+</span>
          <span className="text-sm font-medium">Add activity</span>
        </button>
      </div>

      {modalOpen && (
        <AddActivityModal
          onClose={() => setModalOpen(false)}
          triggerRef={addBtnRef}
        />
      )}
    </>
  )
}
