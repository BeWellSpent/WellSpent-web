import { SystemCategory } from '@/gen/wellspent/v1/common_pb'
import type { Category } from '@/gen/wellspent/v1/budget_pb'

/**
 * Message keys for the seeded system categories, under `budget.systemCategories`.
 *
 * `Record<..., string>` over the enum rather than a partial map: adding a value
 * to `SystemCategory` without adding its key here is then a type error, not a
 * category that silently renders in English forever.
 */
const MESSAGE_KEY: Record<SystemCategory, string | null> = {
  [SystemCategory.UNSPECIFIED]: null,
  [SystemCategory.ENTERTAINMENT]: 'entertainment',
  [SystemCategory.INSURANCE]: 'insurance',
  [SystemCategory.LOAN]: 'loan',
  [SystemCategory.WELLNESS]: 'wellness',
  [SystemCategory.SERVICES]: 'services',
  [SystemCategory.SUBSCRIPTION]: 'subscription',
  [SystemCategory.RENT]: 'rent',
  [SystemCategory.TRAVEL]: 'travel',
  [SystemCategory.EATING_OUT]: 'eatingOut',
  [SystemCategory.GROCERIES]: 'groceries',
  [SystemCategory.BABY]: 'baby',
  [SystemCategory.PET]: 'pet',
  [SystemCategory.MISC]: 'misc',
  [SystemCategory.HOUSE]: 'house',
  [SystemCategory.GAS]: 'gas',
  [SystemCategory.AUTO]: 'auto',
  [SystemCategory.SAVINGS]: 'savings',
  [SystemCategory.SHOPPING]: 'shopping',
  [SystemCategory.FAMILY]: 'family',
  [SystemCategory.INCOME]: 'income',
  [SystemCategory.PAYMENT]: 'payment',
  [SystemCategory.TRANSFER]: 'transfer',
  [SystemCategory.TRANSPORTATION]: 'transportation',
  [SystemCategory.UTILITIES]: 'utilities',
  [SystemCategory.DEBT]: 'debt',
}

/** What `displayCategoryName` needs. Widened from `Category` so callers holding
 *  a partial row (a chart datum, a test fixture) don't have to build a full one. */
export interface NameableCategory {
  name: string
  systemCategory: SystemCategory
}

/**
 * Translates a system category's name; returns a user-created category's name
 * unchanged.
 *
 * The fallback to `cat.name` is load-bearing rather than defensive. The server
 * always sends the English name, so a category seeded *after* this build
 * shipped arrives with a `systemCategory` this code has never heard of and
 * still renders as readable English instead of a raw key.
 *
 * `t` is the `budget.systemCategories` translator.
 */
export function displayCategoryName(
  cat: NameableCategory | null | undefined,
  t: (key: string) => string,
): string {
  if (!cat) return ''
  const key = MESSAGE_KEY[cat.systemCategory]
  if (!key) return cat.name
  return t(key)
}

/**
 * Sorts categories by the name the reader can actually see, so ordering follows
 * the active language rather than the English the rows happen to be stored in.
 */
export function compareByDisplayName(
  a: NameableCategory,
  b: NameableCategory,
  t: (key: string) => string,
  locale?: string,
): number {
  return displayCategoryName(a, t).localeCompare(displayCategoryName(b, t), locale)
}

/** True when this is the given system category. Replaces `c.name === 'Income'`,
 *  which silently stopped matching the moment the name was translated. */
export function isSystemCategory(cat: Category | undefined, which: SystemCategory): boolean {
  return !!cat && cat.isSystem && cat.systemCategory === which
}
