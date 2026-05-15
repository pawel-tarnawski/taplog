import { describe, it, expect } from 'vitest'
import { deriveCode } from './deriveCode'

describe('deriveCode', () => {
  it('uppercases the first 5 chars of the first word', () => {
    expect(deriveCode('Deep work')).toBe('DEEP')
    expect(deriveCode('Email triage')).toBe('EMAIL')
    expect(deriveCode('Code review')).toBe('CODE')
  })

  it('truncates words longer than 5 chars', () => {
    expect(deriveCode('working')).toBe('WORKI')
  })

  it('preserves short names verbatim', () => {
    expect(deriveCode('QA')).toBe('QA')
  })

  it('handles single-word names without spaces', () => {
    expect(deriveCode('research')).toBe('RESEA')
  })

  it('trims surrounding whitespace', () => {
    expect(deriveCode('   Work   ')).toBe('WORK')
  })

  it('collapses internal whitespace and uses only the first token', () => {
    expect(deriveCode('Deep    focus')).toBe('DEEP')
  })

  it('returns empty string for empty / whitespace-only input', () => {
    expect(deriveCode('')).toBe('')
    expect(deriveCode('   ')).toBe('')
  })
})
