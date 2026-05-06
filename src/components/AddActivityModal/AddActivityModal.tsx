import { useState, useEffect, useRef } from 'react'

interface Props {
  onClose: () => void
  onConfirm: (name: string, code?: string) => void
  triggerRef?: React.RefObject<HTMLElement | null>
  initialName?: string
  initialCode?: string
  title?: string
  confirmLabel?: string
}

export function AddActivityModal({
  onClose,
  onConfirm,
  triggerRef,
  initialName = '',
  initialCode = '',
  title = 'New activity',
  confirmLabel = 'Add',
}: Props) {
  const [name, setName] = useState(initialName)
  const [code, setCode] = useState(initialCode)
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
    const trimmedName = name.trim()
    if (!trimmedName) return
    const trimmedCode = code.trim().toUpperCase().slice(0, 5) || undefined
    onConfirm(trimmedName, trimmedCode)
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
        aria-label={title}
        className="w-full max-w-sm rounded-xl bg-sidebar p-6 shadow-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h2 className="mb-4 text-base font-semibold text-primary">{title}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Name</label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Activity name"
              aria-label="Activity name"
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-primary placeholder:text-muted outline-none focus:ring-1"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Short code <span className="text-muted/60">(optional, max 5 chars)</span>
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 5))}
              placeholder="e.g. WORK"
              aria-label="Short code"
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm uppercase text-primary placeholder:normal-case placeholder:text-muted outline-none focus:ring-1"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] rounded-lg px-4 text-sm text-muted transition-colors hover:text-primary"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[48px] rounded-lg px-4 text-sm font-medium text-white transition-opacity disabled:opacity-40"
              style={{ background: '#3b82f6' }}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
