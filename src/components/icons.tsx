/** Inline SVG icons — used instead of Unicode symbols for cross-browser compatibility. */

interface IconProps {
  size: number
  color?: string
}

export function PlayIcon({ size, color = 'currentColor' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export function PauseIcon({ size, color = 'currentColor' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

export function PlusIcon({ size, color = 'currentColor' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function UndoIcon({ size, color = 'currentColor' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true" focusable="false">
      <path d="M3 7v6h6" />
      <path d="M21 17A9 9 0 0 0 6.07 10.07L3 13" />
    </svg>
  )
}

export function ResetIcon({ size, color = 'currentColor' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size} aria-hidden="true" focusable="false">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
    </svg>
  )
}

export function DotsIcon({ size, color = 'currentColor' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}
