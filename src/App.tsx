import { useTick } from './hooks/useTick'
import { TileGrid } from './components/TileGrid'
import { Sidebar } from './components/Sidebar'

export default function App() {
  useTick()

  return (
    <div className="flex h-screen bg-base">
      <main className="flex-1 overflow-hidden p-3 pb-20 min-[480px]:pb-3 min-[480px]:pr-64">
        <TileGrid />
      </main>
      <Sidebar />
    </div>
  )
}
