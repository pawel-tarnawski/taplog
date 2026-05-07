import { useState, useRef, useLayoutEffect } from 'react'
import { useTaplogStore } from './store/taplogStore'
import { useTick } from './hooks/useTick'
import { TileGrid } from './components/TileGrid'
import { Sidebar } from './components/Sidebar'
import { AddActivityModal } from './components/AddActivityModal'

function useAppHeight() {
  useLayoutEffect(() => {
    const update = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
}

export default function App() {
  useTick()
  useAppHeight()

  const addActivity = useTaplogStore((s) => s.addActivity)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex h-screen-safe bg-base">
      <main className="flex-1 p-3 pb-20 min-[300px]:pb-3 min-[300px]:pr-[calc(min(20vw,256px)+12px)]">
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
