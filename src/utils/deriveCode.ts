/**
 * Derive a fallback short code from an activity name.
 * First word, first 5 chars, uppercased — matches the 5-char cap in the modal.
 * Returns "" only when the input has no non-whitespace characters.
 */
export function deriveCode(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0] ?? ''
  return firstWord.slice(0, 5).toUpperCase()
}
