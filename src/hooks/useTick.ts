import { useState, useEffect } from 'react'

export function useTick(intervalMs = 1000): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let lastFired: number | null = null
    let rafId: number

    function frame(timestamp: number) {
      if (lastFired === null) {
        lastFired = timestamp
      } else if (timestamp - lastFired >= intervalMs) {
        lastFired = timestamp
        setTick((t) => t + 1)
      }
      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [intervalMs])

  return tick
}
