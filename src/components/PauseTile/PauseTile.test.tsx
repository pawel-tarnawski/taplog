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

  it('pause button is disabled when nothing is tracking', () => {
    render(<PauseTile />)
    expect(screen.getByRole('button', { name: /pause tracking/i })).toBeDisabled()
  })

  it('pause button is enabled when an activity is tracking', () => {
    const running: Activity = { ...activity, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [running] })
    render(<PauseTile />)
    expect(screen.getByRole('button', { name: /pause tracking/i })).not.toBeDisabled()
  })

  it('clicking pause button stops the running activity', async () => {
    const running: Activity = { ...activity, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [running] })
    render(<PauseTile />)
    await userEvent.click(screen.getByRole('button', { name: /pause tracking/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(false)
  })
})
