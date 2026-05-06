import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TileGrid } from './TileGrid'
import { useTaplogStore } from '../../store/taplogStore'

const onAddActivity = vi.fn()

beforeEach(() => {
  localStorage.clear()
  useTaplogStore.setState({ activities: [], undoSnapshot: null })
  onAddActivity.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TileGrid — empty state', () => {
  it('renders a prominent Add button when there are no activities', () => {
    render(<TileGrid onAddActivity={onAddActivity} />)
    expect(screen.getByRole('button', { name: /add activity/i })).toBeInTheDocument()
  })

  it('calls onAddActivity when the empty-state button is clicked', async () => {
    render(<TileGrid onAddActivity={onAddActivity} />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    expect(onAddActivity).toHaveBeenCalledOnce()
  })

  it('does not render the Pause tile in empty state', () => {
    render(<TileGrid onAddActivity={onAddActivity} />)
    expect(screen.queryByText('Pause')).not.toBeInTheDocument()
  })
})

describe('TileGrid — with activities', () => {
  beforeEach(() => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 0, isRunning: false, startedAt: null },
        { id: '2', name: 'Break', color: '#a855f7', accumulatedMs: 0, isRunning: false, startedAt: null },
      ],
    })
  })

  it('renders a tile for each activity', () => {
    render(<TileGrid onAddActivity={onAddActivity} />)
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Break')).toBeInTheDocument()
  })

  it('always renders the Pause tile', () => {
    render(<TileGrid onAddActivity={onAddActivity} />)
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })

  it('does not render an Add activity button inside the grid', () => {
    render(<TileGrid onAddActivity={onAddActivity} />)
    expect(screen.queryByRole('button', { name: /add activity/i })).not.toBeInTheDocument()
  })

  it('opens edit modal when Rename is selected from activity context menu', async () => {
    render(<TileGrid onAddActivity={onAddActivity} />)
    await userEvent.click(screen.getAllByRole('button', { name: /activity options/i })[0])
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }))
    expect(screen.getByRole('dialog', { name: /edit activity/i })).toBeInTheDocument()
  })

  it('saves renamed activity from the edit modal', async () => {
    render(<TileGrid onAddActivity={onAddActivity} />)
    await userEvent.click(screen.getAllByRole('button', { name: /activity options/i })[0])
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }))
    const nameInput = screen.getByLabelText('Activity name')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Deep Work')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useTaplogStore.getState().activities[0].name).toBe('Deep Work')
  })

  it('uses real container dimensions when getBoundingClientRect returns a size', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0,
      toJSON: () => ({}),
    })
    render(<TileGrid onAddActivity={onAddActivity} />)
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })
})
