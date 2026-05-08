import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PauseTile } from './PauseTile'
import { useTaplogStore } from '../../store/taplogStore'
import type { Activity } from '../../types'

const activity: Activity = {
  id: 'a1',
  name: 'Work',
  color: '#3b82f6',
  accumulatedMs: 0,
  isRunning: false,
  startedAt: null,
}

beforeEach(() => {
  localStorage.clear()
  useTaplogStore.setState({ activities: [], undoSnapshot: null })
})

describe('PauseTile', () => {
  it('renders Pause label', () => {
    render(<PauseTile />)
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })

  it('shows nothing-tracked indicator when no activity is running', () => {
    useTaplogStore.setState({ activities: [activity] })
    render(<PauseTile />)
    expect(screen.getByText(/nothing tracked/i)).toBeInTheDocument()
  })

  it('pause tile is marked disabled when nothing is tracking', () => {
    render(<PauseTile />)
    expect(screen.getByRole('button', { name: /pause tracking/i }))
      .toHaveAttribute('aria-disabled', 'true')
  })

  it('pause tile is not disabled when an activity is tracking', () => {
    const running: Activity = { ...activity, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [running] })
    render(<PauseTile />)
    expect(screen.getByRole('button', { name: /pause tracking/i }))
      .not.toHaveAttribute('aria-disabled', 'true')
  })

  it('clicking pause tile stops the running activity', async () => {
    const running: Activity = { ...activity, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [running] })
    render(<PauseTile />)
    await userEvent.click(screen.getByRole('button', { name: /pause tracking/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(false)
  })

  it('renders micro tile when tile is short', () => {
    render(<PauseTile tileWidth={120} tileHeight={70} />)
    expect(screen.getByRole('button', { name: /pause tracking/i })).toBeInTheDocument()
    expect(screen.queryByText('Pause')).not.toBeInTheDocument()
  })

  it('micro pause button is disabled when nothing is tracking', () => {
    render(<PauseTile tileWidth={120} tileHeight={70} />)
    expect(screen.getByRole('button', { name: /pause tracking/i })).toBeDisabled()
  })

  it('does nothing when tile clicked while idle', async () => {
    render(<PauseTile />)
    await userEvent.click(screen.getByRole('button', { name: /pause tracking/i }))
    expect(useTaplogStore.getState().activities).toHaveLength(0)
  })

  it('activates via keyboard Enter when running', async () => {
    const running: Activity = { ...activity, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [running] })
    render(<PauseTile />)
    screen.getByRole('button', { name: /pause tracking/i }).focus()
    await userEvent.keyboard('{Enter}')
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(false)
  })
})
