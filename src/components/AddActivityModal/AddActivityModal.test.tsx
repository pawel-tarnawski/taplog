import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddActivityModal } from './AddActivityModal'

describe('AddActivityModal', () => {
  it('focuses the name input on open', () => {
    render(<AddActivityModal onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByLabelText(/activity name/i)).toHaveFocus()
  })

  it('submits trimmed name and uppercased code', async () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<AddActivityModal onClose={onClose} onConfirm={onConfirm} />)
    await userEvent.type(screen.getByLabelText(/activity name/i), '  Work  ')
    await userEvent.type(screen.getByLabelText(/short code/i), 'wrk')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(onConfirm).toHaveBeenCalledWith('Work', 'WRK')
    expect(onClose).toHaveBeenCalled()
  })

  it('submit is disabled until both name and code are filled', async () => {
    render(<AddActivityModal onClose={vi.fn()} onConfirm={vi.fn()} />)
    const submit = screen.getByRole('button', { name: /^add$/i })
    expect(submit).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/activity name/i), 'Work')
    expect(submit).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/short code/i), 'WORK')
    expect(submit).not.toBeDisabled()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<AddActivityModal onClose={onClose} onConfirm={vi.fn()} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<AddActivityModal onClose={onClose} onConfirm={vi.fn()} />)
    // The presentation div is the outermost; clicking the dialog itself should NOT close.
    const backdrop = screen.getByRole('dialog').parentElement!
    await userEvent.pointer({ keys: '[MouseLeft]', target: backdrop })
    expect(onClose).toHaveBeenCalled()
  })

  it('Tab from last focusable cycles back to the first (focus trap)', async () => {
    render(<AddActivityModal onClose={vi.fn()} onConfirm={vi.fn()} />)
    const nameInput = screen.getByLabelText(/activity name/i) as HTMLInputElement
    const cancelBtn = screen.getByRole('button', { name: /cancel/i })
    cancelBtn.focus()
    expect(cancelBtn).toHaveFocus()
    await userEvent.tab()
    // submit is disabled (empty name), so cancel is the last focusable.
    expect(nameInput).toHaveFocus()
  })

  it('Shift+Tab from first focusable cycles to the last (focus trap)', async () => {
    render(<AddActivityModal onClose={vi.fn()} onConfirm={vi.fn()} initialName="Work" initialCode="WORK" />)
    const nameInput = screen.getByLabelText(/activity name/i) as HTMLInputElement
    const submitBtn = screen.getByRole('button', { name: /^add$/i })
    nameInput.focus()
    await userEvent.tab({ shift: true })
    expect(submitBtn).toHaveFocus()
  })
})
