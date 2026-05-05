import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityTile } from './ActivityTile'
import { useTaplogStore } from '../../store/taplogStore'
import type { Activity } from '../../types'

const base: Activity = {
  id: 'tile-1',
  name: 'Work',
  accumulatedMs: 0,
  isRunning: false,
  startedAt: null,
}

beforeEach(() => {
  localStorage.clear()
  useTaplogStore.setState({ activities: [base], undoSnapshot: null })
})

describe('ActivityTile', () => {
  it('renders the activity name', () => {
    render(<ActivityTile activity={base} />)
    expect(screen.getByText('Work')).toBeInTheDocument()
  })

  it('shows timer as 00:00:00 when accumulatedMs is 0', () => {
    render(<ActivityTile activity={base} />)
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('toggle button has aria-pressed=false when not running', () => {
    render(<ActivityTile activity={base} />)
    expect(screen.getByRole('button', { name: /start work/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('toggle button has aria-pressed=true when running', () => {
    const running: Activity = { ...base, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [running] })
    render(<ActivityTile activity={running} />)
    expect(screen.getByRole('button', { name: /pause work/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('toggle button meets minimum 80px tap target size', () => {
    const { container } = render(<ActivityTile activity={base} />)
    const btn = container.querySelector('[aria-pressed]') as HTMLElement
    expect(btn.className).toMatch(/h-20/)
    expect(btn.className).toMatch(/w-20/)
  })

  it('starts the timer when toggle button is clicked', async () => {
    render(<ActivityTile activity={base} />)
    await userEvent.click(screen.getByRole('button', { name: /start work/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(true)
  })

  it('pauses the timer when toggle button is clicked again', async () => {
    const running: Activity = { ...base, isRunning: true, startedAt: Date.now() }
    useTaplogStore.setState({ activities: [running] })
    render(<ActivityTile activity={running} />)
    await userEvent.click(screen.getByRole('button', { name: /pause work/i }))
    expect(useTaplogStore.getState().activities[0].isRunning).toBe(false)
  })

  it('opens context menu when ⋯ button is clicked', async () => {
    render(<ActivityTile activity={base} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /rename/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /reset tile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })

  it('⋯ button has aria-haspopup and aria-expanded', async () => {
    render(<ActivityTile activity={base} />)
    const menuBtn = screen.getByRole('button', { name: /activity options/i })
    expect(menuBtn).toHaveAttribute('aria-haspopup', 'menu')
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(menuBtn)
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true')
  })

  it('deletes the activity via context menu', async () => {
    render(<ActivityTile activity={base} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
    expect(useTaplogStore.getState().activities).toHaveLength(0)
  })

  it('resets the activity via context menu and creates undo snapshot', async () => {
    const withMs: Activity = { ...base, accumulatedMs: 5000 }
    useTaplogStore.setState({ activities: [withMs] })
    render(<ActivityTile activity={withMs} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /reset tile/i }))
    expect(useTaplogStore.getState().activities[0].accumulatedMs).toBe(0)
    expect(useTaplogStore.getState().undoSnapshot).not.toBeNull()
  })

  it('shows inline rename input on double-click', async () => {
    render(<ActivityTile activity={base} />)
    await userEvent.dblClick(screen.getByText('Work'))
    expect(screen.getByRole('textbox', { name: /rename activity/i })).toBeInTheDocument()
  })

  it('saves renamed activity on Enter', async () => {
    render(<ActivityTile activity={base} />)
    await userEvent.dblClick(screen.getByText('Work'))
    const input = screen.getByRole('textbox', { name: /rename activity/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Deep Work')
    await userEvent.keyboard('{Enter}')
    expect(useTaplogStore.getState().activities[0].name).toBe('Deep Work')
  })

  it('cancels rename on Escape', async () => {
    render(<ActivityTile activity={base} />)
    await userEvent.dblClick(screen.getByText('Work'))
    const input = screen.getByRole('textbox', { name: /rename activity/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Something else')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('textbox', { name: /rename activity/i })).not.toBeInTheDocument()
    expect(useTaplogStore.getState().activities[0].name).toBe('Work')
  })

  it('rename via context menu opens inline input', async () => {
    render(<ActivityTile activity={base} />)
    await userEvent.click(screen.getByRole('button', { name: /activity options/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /rename/i }))
    expect(screen.getByRole('textbox', { name: /rename activity/i })).toBeInTheDocument()
  })
})
