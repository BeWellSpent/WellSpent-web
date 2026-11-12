import { readFileSync } from 'fs'
import { join } from 'path'
import { FEATURE_GROUPS, featureGroupTranslationKeys } from '../features/featureGroups'
import { pricingTranslationKeys } from '../pricing/plans'

/** Keys built from data (template literals) are invisible to the literal-key sweep, so walk the data here. */
const LOCALES = ['en', 'es'] as const

function landing(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8')).landing
}

function resolve(root: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[part]
    return undefined
  }, root)
}

describe('landing data keys', () => {
  it.each(LOCALES)('every feature-group and pricing key resolves in %s', (locale) => {
    const messages = landing(locale)
    const missing = [...featureGroupTranslationKeys(), ...pricingTranslationKeys()].filter(
      (key) => typeof resolve(messages, key) !== 'string',
    )
    expect(missing).toEqual([])
  })

  it('gives every group a unique key and at least one feature', () => {
    expect(new Set(FEATURE_GROUPS.map((g) => g.key)).size).toBe(FEATURE_GROUPS.length)
    for (const group of FEATURE_GROUPS) expect(group.items.length).toBeGreaterThan(0)
  })

  it('marks bank sync Pro, since the backend refuses it on Free', () => {
    const bank = FEATURE_GROUPS.find((g) => g.key === 'bank')
    expect(bank?.items.find((i) => i.key === 'sync')?.tier).toBe('pro')
  })
})
