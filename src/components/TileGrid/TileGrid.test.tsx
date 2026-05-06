import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TileGrid } from './TileGrid'
import { useTaplogStore } from '../../store/taplogStore'

beforeEach(() => {
  localStorage.clear()
  useTaplogStore.setState({ activities: [], undoSnapshot: null })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TileGrid', () => {
  it('renders the Add activity button', () => {
    render(<TileGrid />)
    expect(screen.getByRole('button', { name: /add activity/i })).toBeInTheDocument()
  })

  it('always renders the Pause tile', () => {
    render(<TileGrid />)
    expect(screen.getByText('Pause')).toBeInTheDocument()
  })

  it('renders a tile for each activity', () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 0, isRunning: false, startedAt: null },
        { id: '2', name: 'Break', color: '#a855f7', accumulatedMs: 0, isRunning: false, startedAt: null },
      ],
    })
    render(<TileGrid />)
    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('Break')).toBeInTheDocument()
  })

  it('opens AddActivityModal when Add button is clicked', async () => {
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes modal and adds activity after form submit', async () => {
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    await userEvent.type(screen.getByLabelText('Activity name'), 'Reading')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useTaplogStore.getState().activities[0].name).toBe('Reading')
  })

  it('adds activity with short code', async () => {
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    await userEvent.type(screen.getByLabelText('Activity name'), 'Reading')
    await userEvent.type(screen.getByLabelText('Short code'), 'READ')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(useTaplogStore.getState().activities[0].code).toBe('READ')
  })

  it('closes modal on Cancel', async () => {
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Add button in modal is disabled when name is empty', async () => {
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled()
  })

  it('opens edit modal when Rename is selected from activity context menu', async () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 0, isRunning: false, startedAt: null },
      ],
    })
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }))
    expect(screen.getByRole('dialog', { name: /edit activity/i })).toBeInTheDocument()
  })

  it('saves renamed activity from the edit modal', async () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', color: '#3b82f6', accumulatedMs: 0, isRunning: false, startedAt: null },
      ],
    })
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
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
    render(<TileGrid />)
    // Grid renders without error when dimensions are available on first layout
    expect(screen.getByRole('button', { name: /add activity/i })).toBeInTheDocument()
  })
})
