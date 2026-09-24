import { isMineOrUnattributed } from '../focusedView'

describe('isMineOrUnattributed', () => {
  it('includes a row attributed to the caller', () => {
    expect(isMineOrUnattributed(1n, 1n)).toBe(true)
  })

  it('includes an unattributed row regardless of who the caller is', () => {
    expect(isMineOrUnattributed(0n, 1n)).toBe(true)
  })

  it('excludes a row attributed to someone else', () => {
    expect(isMineOrUnattributed(2n, 1n)).toBe(false)
  })

  it('excludes everyone when the caller has no resolved person id', () => {
    expect(isMineOrUnattributed(2n, undefined)).toBe(false)
  })
})
