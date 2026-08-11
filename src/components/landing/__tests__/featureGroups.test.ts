import { readFileSync } from 'fs'
import { join } from 'path'
import { FEATURE_GROUPS, featureGroupTranslationKeys } from '../features/featureGroups'

const LOCALES = ['en', 'es'] as const

function loadLanding(locale: string): Record<string, unknown> {
  const raw = readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8')
  return JSON.parse(raw).landing
}

function resolve(root: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[part]
    return undefined
  }, root)
}

describe('FEATURE_GROUPS', () => {
  it('has a unique key and anchor id per group', () => {
    expect(new Set(FEATURE_GROUPS.map((g) => g.key)).size).toBe(FEATURE_GROUPS.length)
    expect(new Set(FEATURE_GROUPS.map((g) => g.id)).size).toBe(FEATURE_GROUPS.length)
  })

  it('lists items for every group that is not marked coming soon', () => {
    for (const group of FEATURE_GROUPS) {
      if (group.comingSoon) continue
      expect(group.items.length).toBeGreaterThan(0)
    }
  })

  it('keeps Reports a placeholder with nothing to show', () => {
    const reports = FEATURE_GROUPS.find((g) => g.key === 'reports')
    expect(reports?.comingSoon).toBe(true)
    expect(reports?.items).toHaveLength(0)
  })

  it('has unique item keys within each group', () => {
    for (const group of FEATURE_GROUPS) {
      expect(new Set(group.items).size).toBe(group.items.length)
    }
  })
})

describe('feature group translations', () => {
  // The group data lives far from the message files, so adding an item and
  // forgetting its copy is easy — and a key missing from any locale is a build
  // failure rather than a visible gap. Fail here instead.
  it.each(LOCALES)('resolves every key in %s', (locale) => {
    const landing = loadLanding(locale)
    const missing = featureGroupTranslationKeys().filter((key) => {
      const value = resolve(landing, key)
      return typeof value !== 'string' || value.trim() === ''
    })
    expect(missing).toEqual([])
  })
})
