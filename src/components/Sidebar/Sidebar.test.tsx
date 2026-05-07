import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { Sidebar } from './Sidebar'
import { useTaplogStore } from '../../store/taplogStore'

const defaultProps = {
  showSidebar: true,
  onAddActivity: vi.fn(),
  addBtnRef: createRef<HTMLButtonElement>(),
}

beforeEach(() => {
  localStorage.clear()
  useTaplogStore.setState({ activities: [], undoSnapshot: null })
})

describe('Sidebar', () => {
  it('renders the date display element', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getAllByTestId('date-display').length).toBeGreaterThan(0)
  })

  it('shows 00:00:00 total time when there are no activities', () => {
    render(<Sidebar {...defaultProps} />)
    const totals = screen.getAllByText('00:00:00')
    expect(totals.length).toBeGreaterThan(0)
  })

  it('shows total accumulated time for all activities', () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 3_600_000, isRunning: false, startedAt: null },
        { id: '2', name: 'Break', color: '#a855f7', accumulatedMs: 900_000, isRunning: false, startedAt: null },
      ],
    })
    render(<Sidebar {...defaultProps} />)
    expect(screen.getAllByText('01:15:00').length).toBeGreaterThan(0)
  })

  it('shows per-activity breakdown', () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 3_600_000, isRunning: false, startedAt: null },
      ],
    })
    render(<Sidebar {...defaultProps} />)
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0)
    expect(screen.getAllByText('01:00:00').length).toBeGreaterThan(0)
  })

  it('hides undo button when no snapshot', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.queryByRole('button', { name: /undo reset/i })).not.toBeInTheDocument()
  })

  it('shows undo button when a snapshot exists', () => {
    useTaplogStore.setState({
      undoSnapshot: {
        timestamp: Date.now(),
        activities: [{ id: '1', accumulatedMs: 5_000 }],
      },
    })
    render(<Sidebar {...defaultProps} />)
    expect(screen.getAllByRole('button', { name: /undo reset/i }).length).toBeGreaterThan(0)
  })

  it('calls undo when undo button is clicked', async () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 0, isRunning: false, startedAt: null },
      ],
      undoSnapshot: {
        timestamp: Date.now(),
        activities: [{ id: '1', accumulatedMs: 9_000 }],
      },
    })
    render(<Sidebar {...defaultProps} />)
    const undoBtns = screen.getAllByRole('button', { name: /undo reset/i })
    await userEvent.click(undoBtns[0])
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(9_000)
    expect(useTaplogStore.getState().undoSnapshot).toBeNull()
  })

  it('calls resetAll when Reset all button is clicked', async () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 5_000, isRunning: false, startedAt: null },
      ],
    })
    render(<Sidebar {...defaultProps} />)
    const resetBtns = screen.getAllByRole('button', { name: /reset all/i })
    await userEvent.click(resetBtns[0])
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(0)
    expect(useTaplogStore.getState().undoSnapshot).not.toBeNull()
  })
})
