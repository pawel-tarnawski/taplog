import { useTick } from './hooks/useTick'
import { TileGrid } from './components/TileGrid'
import { Sidebar } from './components/Sidebar'

export default function App() {
  useTick()

  return (
    <div className="flex h-screen bg-base">
      <main className="flex-1 p-3 pb-20 min-[440px]:pb-3 min-[440px]:pr-[calc(min(20vw,256px)+12px)]">
        <TileGrid />
      </main>
      <Sidebar />
    </div>
  )
}
