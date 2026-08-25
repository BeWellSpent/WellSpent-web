import type { DismissalStorage } from '@/components/status/dismissal'
import { lastSeenVersion, markSeen, readSeen } from '../seenVersions'

function memoryStorage(initial: Record<string, string> = {}): DismissalStorage {
  const data = { ...initial }
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => { data[k] = v },
  }
}

describe('seenVersions', () => {
  it('remembers a version per component independently', () => {
    const storage = memoryStorage()
    markSeen(storage, 'web', '1.27.0')
    markSeen(storage, 'server', '1.0.0')
    expect(lastSeenVersion(storage, 'web')).toBe('1.27.0')
    expect(lastSeenVersion(storage, 'server')).toBe('1.0.0')
  })

  it('reports null for a component never seen', () => {
    expect(lastSeenVersion(memoryStorage(), 'web')).toBeNull()
  })

  it('overwrites rather than accumulating', () => {
    const storage = memoryStorage()
    markSeen(storage, 'web', '1.27.0')
    markSeen(storage, 'web', '1.28.0')
    expect(readSeen(storage)).toEqual({ web: '1.28.0' })
  })

  // A corrupted key must not throw on every page load forever.
  it('treats unreadable storage as empty', () => {
    expect(readSeen(memoryStorage({ 'wellspent.changelogSeen': 'not json' }))).toEqual({})
    expect(readSeen(memoryStorage({ 'wellspent.changelogSeen': '["an","array"]' }))).toEqual({})
    expect(readSeen(memoryStorage({ 'wellspent.changelogSeen': '{"web":42}' }))).toEqual({})
  })

  // SSR has no window; the caller passes null.
  it('is inert without storage', () => {
    expect(readSeen(null)).toEqual({})
    expect(lastSeenVersion(null, 'web')).toBeNull()
    expect(() => markSeen(null, 'web', '1.0.0')).not.toThrow()
  })
})
