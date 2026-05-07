import { useState, useRef } from 'react'
import { useTaplogStore } from './store/taplogStore'
import { useTick } from './hooks/useTick'
import { TileGrid } from './components/TileGrid'
import { Sidebar } from './components/Sidebar'
import { AddActivityModal } from './components/AddActivityModal'

export default function App() {
  useTick()

  const addActivity = useTaplogStore((s) => s.addActivity)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex h-screen-safe bg-base">
      <main className="flex-1 p-3 pb-20 min-[380px]:pb-3 min-[380px]:pr-[calc(min(20vw,256px)+12px)]">
        <TileGrid onAddActivity={() => setAddModalOpen(true)} />
      </main>
      <Sidebar onAddActivity={() => setAddModalOpen(true)} addBtnRef={addBtnRef} />

      {addModalOpen && (
        <AddActivityModal
          onClose={() => setAddModalOpen(false)}
          onConfirm={addActivity}
          triggerRef={addBtnRef}
        />
      )}
    </div>
  )
}
