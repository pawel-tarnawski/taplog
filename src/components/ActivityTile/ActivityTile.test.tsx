import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityTile } from './ActivityTile'
import { useTaplogStore } from '../../store/taplogStore'
import type { Activity } from '../../types'

const base: Activity = {
  id: 'tile-1',
  name: 'Work',
  code: 'WORK',
  color: '#3b82f6',
  accumulatedMs: 0,
  isRunning: false,
  startedAt: null,
}

const onEdit = () => {}

beforeEach(() => {
  localStorage.clear()
  useTaplogStore.setState({ activities: [base], undoSnapshot: null })
})

describe('ActivityTile', () => {
  it('renders the activity name', () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('shows timer as 00:00:00 when accumulatedMs is 0', () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('toggle button has aria-pressed=false when not tracking', () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    expect(screen.getByRole('button', { name: /start tracking work/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('toggle button has aria-pressed=true when tracking', () => {
    const tracking: Activity = { ...base, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [tracking] })
    render(<ActivityTile activity={tracking} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    expect(screen.getByRole('button', { name: /stop tracking work/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('visual indicator is sized proportionally to tile', () => {
    const { container } = render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    const indicator = container.querySelector('.rounded-full') as HTMLElement
    expect(parseInt(indicator.style.width)).toBeGreaterThan(0)
    expect(parseInt(indicator.style.height)).toBeGreaterThan(0)
  })

  it('starts tracking when toggle button is clicked', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /start tracking work/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(true)
  })

  it('stops tracking when toggle button is clicked again', async () => {
    const tracking: Activity = { ...base, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [tracking] })
    render(<ActivityTile activity={tracking} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /stop tracking work/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(false)
  })

  it('opens context menu on ⋯ click', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /rename/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /reset tile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })

  it('calls onEdit when Rename is selected from context menu', async () => {
    let called: Activity | null = null
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={(a) => { called = a }} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }))
    expect(called).not.toBeNull()
  })

  it('deletes the activity via context menu', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
    expect(useTaplogStore.getState().activities).toHaveLength(0)
  })

  it('resets the activity via context menu and saves snapshot', async () => {
    const withMs: Activity = { ...base, accumulatedMs: 5000 }
    useTaplogStore.setState({ activities: [withMs] })
    render(<ActivityTile activity={withMs} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /reset tile/i }))
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(0)
    expect(useTaplogStore.getState().undoSnapshot).not.toBeNull()
  })

  it('whole tile acts as the toggle button', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /start tracking/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(true)
  })

  it('shows code label when tile is narrow and code is set', () => {
    const withCode: Activity = { ...base, code: 'WRK' }
    render(<ActivityTile activity={withCode} tileWidth={100} tileHeight={200} onEdit={onEdit} />)
    expect(screen.getByText('WRK')).toBeInTheDocument()
  })

  it('shows name when tile is wide enough', () => {
    const withCode: Activity = { ...base, code: 'WRK' }
    render(<ActivityTile activity={withCode} tileWidth={300} tileHeight={300} onEdit={onEdit} />)
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('renders micro tile with badge when tile is short', () => {
    const withCode: Activity = { ...base, code: 'WRK' }
    render(<ActivityTile activity={withCode} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
    expect(screen.getByRole('button', { name: /start tracking/i })).toBeInTheDocument()
    expect(screen.getByText('WRK')).toBeInTheDocument()
  })

  it('micro tile always shows the code (mandatory)', () => {
    render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
    expect(screen.getByRole('button', { name: /start tracking/i })).toBeInTheDocument()
    expect(screen.getByText('WORK')).toBeInTheDocument()
  })

  it('toggles timer in micro tile mode', async () => {
    render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /start tracking/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(true)
  })

  describe('micro tile actions menu', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('opens the actions menu after a long press', () => {
      vi.useFakeTimers()
      render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
      const tile = screen.getByRole('button', { name: /start tracking work/i })
      fireEvent.pointerDown(tile)
      act(() => vi.advanceTimersByTime(500)) // LONG_PRESS_MS
      expect(screen.getByRole('menu')).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /rename/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /reset tile/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
    })

    it('a short press toggles the timer (no menu)', () => {
      vi.useFakeTimers()
      render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
      const tile = screen.getByRole('button', { name: /start tracking work/i })
      fireEvent.pointerDown(tile)
      act(() => vi.advanceTimersByTime(200))
      fireEvent.pointerUp(tile)
      fireEvent.click(tile)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(useTaplogStore.getState().activities[0].isRunning).toBe(true)
    })

    it('after long-press, the trailing click does not toggle the timer', () => {
      vi.useFakeTimers()
      render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
      const tile = screen.getByRole('button', { name: /start tracking work/i })
      fireEvent.pointerDown(tile)
      act(() => vi.advanceTimersByTime(500))
      fireEvent.pointerUp(tile)
      fireEvent.click(tile)
      expect(useTaplogStore.getState().activities[0].isRunning).toBe(false)
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('keyboard Shift+F10 opens the actions menu', async () => {
      render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
      screen.getByRole('button', { name: /start tracking work/i }).focus()
      await userEvent.keyboard('{Shift>}{F10}{/Shift}')
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('deletes via the long-press menu', async () => {
      vi.useFakeTimers()
      render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
      const tile = screen.getByRole('button', { name: /start tracking work/i })
      fireEvent.pointerDown(tile)
      act(() => vi.advanceTimersByTime(500))
      vi.useRealTimers()
      await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
      expect(useTaplogStore.getState().activities).toHaveLength(0)
    })

    it('drops the menu down when the tile is in the top of the viewport', async () => {
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        top: 20, bottom: 140, left: 0, right: 120, width: 120, height: 120, x: 0, y: 20, toJSON: () => ({}),
      })
      render(<ActivityTile activity={base} tileWidth={120} tileHeight={120} onEdit={onEdit} />)
      screen.getByRole('button', { name: /start tracking work/i }).focus()
      await userEvent.keyboard('{Shift>}{F10}{/Shift}')
      const menu = screen.getByRole('menu')
      expect(menu.className).toContain('top-full')
      expect(menu.className).not.toContain('bottom-full')
    })

    it('flips the menu up when the tile is near the bottom of the viewport', async () => {
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
      // Tile sits at the bottom — only 30 px below it, but 660 px above.
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        top: 660, bottom: 770, left: 0, right: 120, width: 120, height: 110, x: 0, y: 660, toJSON: () => ({}),
      })
      render(<ActivityTile activity={base} tileWidth={120} tileHeight={120} onEdit={onEdit} />)
      screen.getByRole('button', { name: /start tracking work/i }).focus()
      await userEvent.keyboard('{Shift>}{F10}{/Shift}')
      const menu = screen.getByRole('menu')
      expect(menu.className).toContain('bottom-full')
      expect(menu.className).not.toContain('top-full')
    })
  })

  it('activates tile via keyboard Enter', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    screen.getByRole('button', { name: /start tracking work/i }).focus()
    await userEvent.keyboard('{Enter}')
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(true)
  })

  it('activates tile via keyboard Space', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    screen.getByRole('button', { name: /start tracking work/i }).focus()
    await userEvent.keyboard(' ')
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(true)
  })

  it('⋯ click does not toggle the tile', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(false)
  })
})
