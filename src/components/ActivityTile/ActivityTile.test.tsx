import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityTile } from './ActivityTile'
import { useTaplogStore } from '../../store/taplogStore'
import type { Activity } from '../../types'

const base: Activity = {
  id: 'tile-1',
  name: 'Work',
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

  it('toggle button is at least 80×80px (inline style)', () => {
    const { container } = render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    const btn = container.querySelector('[aria-pressed]') as HTMLElement
    expect(parseInt(btn.style.width)).toBeGreaterThanOrEqual(80)
    expect(parseInt(btn.style.height)).toBeGreaterThanOrEqual(80)
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

  it('shows inline rename input on double-click', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.dblClick(screen.getByText('Work'))
    expect(screen.getByRole('textbox', { name: /rename activity/i })).toBeInTheDocument()
  })

  it('saves name on Enter from inline edit', async () => {
    render(<ActivityTile activity={base} tileWidth={200} tileHeight={200} onEdit={onEdit} />)
    await userEvent.dblClick(screen.getByText('Work'))
    const input = screen.getByRole('textbox', { name: /rename activity/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Deep Work')
    await userEvent.keyboard('{Enter}')
    expect(useTaplogStore.getState().activities[0].name).toBe('Deep Work')
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

  it('renders micro tile with name when no code and tile is short', () => {
    render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
    expect(screen.getByRole('button', { name: /start tracking/i })).toBeInTheDocument()
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('toggles timer in micro tile mode', async () => {
    render(<ActivityTile activity={base} tileWidth={120} tileHeight={70} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /start tracking/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(true)
  })
})
