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
