import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTick } from './useTick'

describe('useTick', () => {
  let rafCallbacks: Array<FrameRequestCallback>
  let rafId: number

  beforeEach(() => {
    rafCallbacks = []
    rafId = 0
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return ++rafId
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function fireRaf(timestamp: number) {
    const callbacks = [...rafCallbacks]
    rafCallbacks = []
    for (const cb of callbacks) cb(timestamp)
  }

  it('starts at 0', () => {
    const { result } = renderHook(() => useTick())
    expect(result.current).toBe(0)
  })

  it('increments when the interval elapses', () => {
    const { result } = renderHook(() => useTick(100))
    act(() => fireRaf(0))
    expect(result.current).toBe(0)
    act(() => fireRaf(100))
    expect(result.current).toBe(1)
    act(() => fireRaf(200))
    expect(result.current).toBe(2)
  })

  it('does not increment before the interval elapses', () => {
    const { result } = renderHook(() => useTick(1000))
    act(() => fireRaf(0))
    act(() => fireRaf(500))
    expect(result.current).toBe(0)
  })

  it('cancels RAF on unmount', () => {
    const { unmount } = renderHook(() => useTick())
    unmount()
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })

  it('does not schedule RAF when disabled (null interval)', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame')
    rafSpy.mockClear()
    renderHook(() => useTick(null))
    expect(rafSpy).not.toHaveBeenCalled()
  })

  it('starts ticking when interval changes from null to a number', () => {
    const { result, rerender } = renderHook(({ ms }: { ms: number | null }) => useTick(ms), {
      initialProps: { ms: null as number | null },
    })
    expect(result.current).toBe(0)
    rerender({ ms: 100 })
    act(() => fireRaf(0))
    act(() => fireRaf(100))
    expect(result.current).toBe(1)
  })
})
