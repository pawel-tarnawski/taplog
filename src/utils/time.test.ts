import { describe, it, expect } from 'vitest'
import { formatMs } from './time'

describe('formatMs', () => {
  it('formats zero as 00:00:00', () => {
    expect(formatMs(0)).toBe('00:00:00')
  })

  it('formats sub-second values as 00:00:00', () => {
    expect(formatMs(999)).toBe('00:00:00')
  })

  it('formats 59999ms as 00:00:59', () => {
    expect(formatMs(59999)).toBe('00:00:59')
  })

  it('formats 3599999ms as 00:59:59', () => {
    expect(formatMs(3599999)).toBe('00:59:59')
  })

  it('formats 86399999ms as 23:59:59', () => {
    expect(formatMs(86399999)).toBe('23:59:59')
  })

  it('formats exactly 1 second', () => {
    expect(formatMs(1000)).toBe('00:00:01')
  })

  it('formats exactly 1 minute', () => {
    expect(formatMs(60000)).toBe('00:01:00')
  })

  it('formats exactly 1 hour', () => {
    expect(formatMs(3600000)).toBe('01:00:00')
  })

  it('pads single-digit values with leading zeros', () => {
    expect(formatMs(3661000)).toBe('01:01:01')
  })
})
