import { useState, useEffect, useRef } from 'react'
import { useTaplogStore } from '../../store/taplogStore'

interface Props {
  onClose: () => void
  triggerRef?: React.RefObject<HTMLElement | null>
}

export function AddActivityModal({ onClose, triggerRef }: Props) {
  const addActivity = useTaplogStore((s) => s.addActivity)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const trigger = triggerRef?.current ?? null
    inputRef.current?.focus()
    return () => {
      trigger?.focus()
    }
  }, [triggerRef])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    addActivity(trimmed)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add activity"
        className="w-full max-w-sm rounded-xl border border-white/10 bg-sidebar p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-base font-semibold text-primary">New activity</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Activity name"
            aria-label="Activity name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-primary placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] rounded-lg px-4 text-sm text-muted transition-colors hover:text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[48px] rounded-lg bg-accent px-4 text-sm font-medium text-white transition-opacity disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
