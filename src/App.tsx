import { useState, useRef, useLayoutEffect } from 'react'
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

  // JS-driven layout: CSS media queries are unreliable in some mobile browsers
  // (e.g. Via Browser locks viewport to 320px regardless of orientation).
  // window.innerWidth is always correct.
  const [showSidebar, setShowSidebar] = useState(() => window.innerWidth >= 300)

  useLayoutEffect(() => {
    const update = () => {
      setShowSidebar(window.innerWidth >= 300)
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

  return (
    <div className="flex h-screen-safe bg-base">
      <main className={`flex-1 p-3 ${showSidebar ? 'pb-3 pr-[calc(min(20vw,256px)+12px)]' : 'pb-20'}`}>
        <TileGrid onAddActivity={() => setAddModalOpen(true)} />
      </main>
      <Sidebar showSidebar={showSidebar} onAddActivity={() => setAddModalOpen(true)} addBtnRef={addBtnRef} />

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
