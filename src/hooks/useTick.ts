import { useState, useEffect } from 'react'

/**
 * Re-renders the caller every `intervalMs`. Pass `null` to disable —
 * paused timer components should opt out so they don't burn CPU on old devices.
 */
export function useTick(intervalMs: number | null = 1000): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (intervalMs === null) return
    const interval = intervalMs
    let lastFired: number | null = null
    let rafId: number

    function frame(timestamp: number) {
      if (lastFired === null) {
        lastFired = timestamp
      } else if (timestamp - lastFired >= interval) {
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
