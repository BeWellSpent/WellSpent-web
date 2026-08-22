import { SystemCategory } from '@/gen/wellspent/v1/common_pb'
import type { Category } from '@/gen/wellspent/v1/budget_pb'
import enMessages from '../../../../messages/en.json'
import esMessages from '../../../../messages/es.json'
import {
  displayCategoryName,
  compareByDisplayName,
  isSystemCategory,
  type NameableCategory,
} from '../systemCategory'

const en = enMessages.budget.systemCategories as Record<string, string>
const es = esMessages.budget.systemCategories as Record<string, string>

const t = (messages: Record<string, string>) => (key: string) => {
  if (!(key in messages)) throw new Error(`MISSING_MESSAGE: ${key}`)
  return messages[key]
}

const cat = (over: Partial<NameableCategory>): NameableCategory => ({
  name: 'Groceries',
  systemCategory: SystemCategory.GROCERIES,
  ...over,
})

describe('displayCategoryName', () => {
  it('translates a system category', () => {
    expect(displayCategoryName(cat({}), t(es))).toBe('Supermercado')
  })

  it('returns a user-created category verbatim, in every language', () => {
    const mine = cat({ name: 'Bouldering gym', systemCategory: SystemCategory.UNSPECIFIED })
    expect(displayCategoryName(mine, t(en))).toBe('Bouldering gym')
    expect(displayCategoryName(mine, t(es))).toBe('Bouldering gym')
  })

  // The whole point of keeping `name` English on the wire. A category seeded
  // after this build shipped arrives with an enum value this code has never
  // seen; it has to read as English, not as a raw key or an empty cell.
  it('falls back to the English name for an enum value it does not know', () => {
    const future = { name: 'Childcare', systemCategory: 999 as SystemCategory }
    expect(displayCategoryName(future, t(en))).toBe('Childcare')
  })

  it('returns empty for a missing category rather than throwing', () => {
    expect(displayCategoryName(undefined, t(en))).toBe('')
    expect(displayCategoryName(null, t(en))).toBe('')
  })

  // A key present in the map but absent from a locale file throws
  // MISSING_MESSAGE at render time — the build and lint both pass on it (see
  // BudgetList's auth.logout). Sweep every mapped value against both locales.
  it.each([
    ['en', en],
    ['es', es],
  ])('has a %s message for every system category', (_locale, messages) => {
    const values = Object.values(SystemCategory).filter(
      (v): v is SystemCategory => typeof v === 'number' && v !== SystemCategory.UNSPECIFIED,
    )
    expect(values.length).toBe(25)
    for (const value of values) {
      expect(() => displayCategoryName({ name: 'fallback', systemCategory: value }, t(messages))).not.toThrow()
      expect(displayCategoryName({ name: 'fallback', systemCategory: value }, t(messages))).not.toBe('fallback')
    }
  })
})

describe('compareByDisplayName', () => {
  // Ordering has to follow the language on screen, not the English the rows
  // are stored in. In Spanish, Ahorros (Savings) sorts before Auto; in English
  // Auto sorts before Savings.
  it('orders by the translated name, so order differs per language', () => {
    const auto = cat({ name: 'Auto', systemCategory: SystemCategory.AUTO })
    const savings = cat({ name: 'Savings', systemCategory: SystemCategory.SAVINGS })
    expect(compareByDisplayName(auto, savings, t(en), 'en')).toBeLessThan(0)
    expect(compareByDisplayName(auto, savings, t(es), 'es')).toBeGreaterThan(0)
  })
})

describe('isSystemCategory', () => {
  const full = (over: Partial<Category>) =>
    ({ id: 1, name: 'Income', isSystem: true, systemCategory: SystemCategory.INCOME, ...over }) as Category

  it('matches on the enum, not the name', () => {
    // Same category, name already translated — the check must still hold.
    expect(isSystemCategory(full({ name: 'Ingresos' }), SystemCategory.INCOME)).toBe(true)
  })

  it('does not match a different system category', () => {
    expect(isSystemCategory(full({}), SystemCategory.SAVINGS)).toBe(false)
  })

  // A user could name their own category "Income". Before this change that
  // category would have been excluded from every spending total.
  it('does not match a user category that happens to share the name', () => {
    expect(
      isSystemCategory(
        full({ isSystem: false, systemCategory: SystemCategory.UNSPECIFIED }),
        SystemCategory.INCOME,
      ),
    ).toBe(false)
  })

  it('handles a missing category', () => {
    expect(isSystemCategory(undefined, SystemCategory.INCOME)).toBe(false)
  })
})
