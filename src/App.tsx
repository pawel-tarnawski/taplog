import { useState, useRef, useLayoutEffect } from 'react'
import { useTaplogStore } from './store/taplogStore'
import { useTick } from './hooks/useTick'
import { TileGrid } from './components/TileGrid'
import { Sidebar } from './components/Sidebar'
import { AddActivityModal } from './components/AddActivityModal'

const SIDEBAR_MIN = 160
const SIDEBAR_MAX = 256
const SIDEBAR_BREAKPOINT = 300

function sidebarWidthFor(vw: number) {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(vw * 0.2)))
}

export default function App() {
  useTick()

  const addActivity = useTaplogStore((s) => s.addActivity)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  const [showSidebar, setShowSidebar] = useState(() => window.innerWidth >= SIDEBAR_BREAKPOINT)
  const [sidebarW, setSidebarW]       = useState(() => sidebarWidthFor(window.innerWidth))

  useLayoutEffect(() => {
    const update = () => {
      const vw = window.innerWidth
      setShowSidebar(vw >= SIDEBAR_BREAKPOINT)
      setSidebarW(sidebarWidthFor(vw))
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
      <main
        className="flex-1 p-3"
        style={showSidebar
          ? { paddingBottom: '12px', paddingRight: `${sidebarW + 12}px` }
          : { paddingBottom: '80px' }}
      >
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
