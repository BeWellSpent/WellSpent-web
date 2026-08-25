import type { ChangelogRelease } from '@/gen/wellspent/v1/changelog_pb'
import { localizedSummary, releasesToAnnounce } from '../announce'

function release(version: string): ChangelogRelease {
  return { id: version, version } as unknown as ChangelogRelease
}

// Newest first, the order the server returns them in.
const history = [release('1.3.0'), release('1.2.0'), release('1.1.0'), release('1.0.0')]

describe('releasesToAnnounce', () => {
  // Someone signing in for the first time should not be met with the entire
  // history of the product.
  it('announces nothing on a first-ever run', () => {
    expect(releasesToAnnounce(history, '1.3.0', null)).toEqual([])
  })

  it('announces every release since the one last seen, not just the newest', () => {
    const out = releasesToAnnounce(history, '1.3.0', '1.1.0')
    expect(out.map((r) => r.version)).toEqual(['1.3.0', '1.2.0'])
  })

  it('announces nothing when the reader is already up to date', () => {
    expect(releasesToAnnounce(history, '1.3.0', '1.3.0')).toEqual([])
  })

  // A deploy can publish notes before every browser has been served the new
  // bundle. Announcing a version the reader does not have is worse than
  // announcing nothing.
  it('never announces a version newer than the one actually running', () => {
    const out = releasesToAnnounce(history, '1.1.0', '1.0.0')
    expect(out.map((r) => r.version)).toEqual(['1.1.0'])
  })

  it('falls back to the newest single release when the last seen version is gone', () => {
    const out = releasesToAnnounce(history, '1.3.0', '0.9.0')
    expect(out.map((r) => r.version)).toEqual(['1.3.0'])
  })

  it('announces nothing when nothing has been published', () => {
    expect(releasesToAnnounce([], '1.0.0', '0.9.0')).toEqual([])
  })
})

describe('localizedSummary', () => {
  it('uses Spanish for a Spanish reader', () => {
    expect(localizedSummary('Added a thing', 'Agregamos algo', 'es')).toBe('Agregamos algo')
  })

  // Spanish is optional on the row — an untranslated note must still be
  // readable rather than rendering blank.
  it('falls back to English when there is no translation', () => {
    expect(localizedSummary('Added a thing', '', 'es')).toBe('Added a thing')
    expect(localizedSummary('Added a thing', '   ', 'es')).toBe('Added a thing')
  })

  it('uses English for an English reader even when Spanish exists', () => {
    expect(localizedSummary('Added a thing', 'Agregamos algo', 'en')).toBe('Added a thing')
  })
})
