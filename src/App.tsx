import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useTaplogStore } from './store/taplogStore'
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
  const addActivity = useTaplogStore((s) => s.addActivity)
  const checkDayChange = useTaplogStore((s) => s._checkDayChange)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  const [showSidebar, setShowSidebar] = useState(() => window.innerWidth >= SIDEBAR_BREAKPOINT)
  const [sidebarW, setSidebarW]       = useState(() => sidebarWidthFor(window.innerWidth))
  const [windowH, setWindowH]         = useState(() => window.innerHeight)

  useLayoutEffect(() => {
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      setShowSidebar(vw >= SIDEBAR_BREAKPOINT)
      setSidebarW(sidebarWidthFor(vw))
      setWindowH(vh)
      document.documentElement.style.setProperty('--app-height', `${vh}px`)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  // Daily reset: also check when the tab returns to foreground and once a minute,
  // so the app doesn't accumulate time into the next day if left open overnight.
  useEffect(() => {
    checkDayChange()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkDayChange()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const interval = window.setInterval(checkDayChange, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(interval)
    }
  }, [checkDayChange])

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
      <Sidebar
        showSidebar={showSidebar}
        sidebarWidth={sidebarW}
        sidebarHeight={windowH}
        onAddActivity={() => setAddModalOpen(true)}
        addBtnRef={addBtnRef}
      />

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
