import { clampNumber, indexForValue, indexFromScrollTop } from '../ScrollNumberPicker'

describe('clampNumber', () => {
  it('returns the value unchanged when within range', () => {
    expect(clampNumber(5, 1, 10)).toBe(5)
  })
  it('clamps below min', () => {
    expect(clampNumber(-3, 1, 10)).toBe(1)
  })
  it('clamps above max', () => {
    expect(clampNumber(99, 1, 10)).toBe(10)
  })
})

describe('indexForValue', () => {
  it('computes a zero-based index from min', () => {
    expect(indexForValue(1, 1, 52)).toBe(0)
    expect(indexForValue(15, 1, 52)).toBe(14)
    expect(indexForValue(52, 1, 52)).toBe(51)
  })
  it('clamps out-of-range values before indexing', () => {
    expect(indexForValue(0, 1, 24)).toBe(0)
    expect(indexForValue(999, 1, 24)).toBe(23)
  })
})

describe('indexFromScrollTop', () => {
  it('rounds to the nearest item index', () => {
    expect(indexFromScrollTop(0, 40, 51)).toBe(0)
    expect(indexFromScrollTop(38, 40, 51)).toBe(1)
    expect(indexFromScrollTop(22, 40, 51)).toBe(1)
    expect(indexFromScrollTop(19, 40, 51)).toBe(0)
  })
  it('clamps to [0, maxIndex]', () => {
    expect(indexFromScrollTop(-100, 40, 51)).toBe(0)
    expect(indexFromScrollTop(1e9, 40, 51)).toBe(51)
  })
})
