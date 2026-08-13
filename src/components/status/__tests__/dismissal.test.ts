import { isDismissed, markDismissed, readDismissed, type DismissalStorage } from '../dismissal'

function fakeStorage(initial: Record<string, string> = {}): DismissalStorage & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v
    },
  }
}

const KEY = 'wellspent.statusBannerDismissed'

describe('markDismissed / isDismissed', () => {
  it('remembers a dismissed banner', () => {
    const storage = fakeStorage()
    markDismissed(storage, 'b1')
    expect(isDismissed(storage, 'b1')).toBe(true)
  })

  it('does not suppress a different banner', () => {
    // Keying on the ID is the whole point: closing one notice must not hide
    // the next, unrelated one.
    const storage = fakeStorage()
    markDismissed(storage, 'b1')
    expect(isDismissed(storage, 'b2')).toBe(false)
  })

  it('keeps earlier dismissals when a new one is added', () => {
    const storage = fakeStorage()
    markDismissed(storage, 'b1')
    markDismissed(storage, 'b2')
    expect(isDismissed(storage, 'b1')).toBe(true)
    expect(isDismissed(storage, 'b2')).toBe(true)
  })

  it('does not duplicate an ID dismissed twice', () => {
    const storage = fakeStorage()
    markDismissed(storage, 'b1')
    markDismissed(storage, 'b1')
    expect(readDismissed(storage)).toEqual(['b1'])
  })

  it('caps the remembered list so it cannot grow forever', () => {
    // One key holding a capped list, not one key per banner — otherwise this
    // accumulates in a long-lived browser indefinitely.
    const storage = fakeStorage()
    for (let i = 0; i < 30; i++) markDismissed(storage, `b${i}`)

    const stored = readDismissed(storage)
    expect(stored).toHaveLength(20)
    expect(stored[0]).toBe('b29')
    expect(isDismissed(storage, 'b0')).toBe(false)
  })
})

describe('readDismissed', () => {
  it('returns nothing when there is no storage at all', () => {
    // SSR, and browsers where privacy settings make localStorage throw on
    // access.
    expect(readDismissed(null)).toEqual([])
    expect(isDismissed(null, 'b1')).toBe(false)
  })

  it('survives corrupted JSON in its key', () => {
    // Otherwise a single bad write throws at the top of every page, forever.
    const storage = fakeStorage({ [KEY]: '{not json' })
    expect(readDismissed(storage)).toEqual([])
  })

  it('ignores a value of the wrong shape', () => {
    const storage = fakeStorage({ [KEY]: '{"a":1}' })
    expect(readDismissed(storage)).toEqual([])
  })

  it('drops non-string entries rather than trusting the array wholesale', () => {
    const storage = fakeStorage({ [KEY]: '["b1", 42, null, "b2"]' })
    expect(readDismissed(storage)).toEqual(['b1', 'b2'])
  })
})

describe('markDismissed when storage rejects writes', () => {
  it('does not throw', () => {
    // Private browsing and a full quota both throw on setItem. A dismissal
    // that doesn't stick beats a crash at the top of the page.
    const throwing: DismissalStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(() => markDismissed(throwing, 'b1')).not.toThrow()
  })

  it('is a no-op without storage', () => {
    expect(() => markDismissed(null, 'b1')).not.toThrow()
  })
})
