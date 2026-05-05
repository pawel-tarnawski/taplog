import { useTick } from './hooks/useTick'
import { TileGrid } from './components/TileGrid'
import { Sidebar } from './components/Sidebar'

export default function App() {
  useTick()

  return (
    <div className="min-h-screen bg-base">
      <main className="p-4 pb-20 sm:pr-68 sm:pb-4">
        <TileGrid />
      </main>
      <Sidebar />
    </div>
  )
}
