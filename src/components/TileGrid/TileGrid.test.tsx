import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TileGrid } from './TileGrid'
import { useTaplogStore } from '../../store/taplogStore'

beforeEach(() => {
  localStorage.clear()
  useTaplogStore.setState({ activities: [], undoSnapshot: null })
})

describe('TileGrid', () => {
  it('renders the Add activity button', () => {
    render(<TileGrid />)
    expect(screen.getByRole('button', { name: /add activity/i })).toBeInTheDocument()
  })

  it('renders a tile for each activity', () => {
    useTaplogStore.setState({
      activities: [
        { id: '1', name: 'Work', accumulatedMs: 0, isRunning: false, startedAt: null },
        { id: '2', name: 'Break', accumulatedMs: 0, isRunning: false, startedAt: null },
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

  it('closes the modal after adding an activity', async () => {
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    const input = screen.getByRole('textbox', { name: /activity name/i })
    await userEvent.type(input, 'Reading')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useTaplogStore.getState().activities[0].name).toBe('Reading')
  })

  it('closes the modal on Cancel', async () => {
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Add button in modal is disabled when input is empty', async () => {
    render(<TileGrid />)
    await userEvent.click(screen.getByRole('button', { name: /add activity/i }))
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled()
  })
})
