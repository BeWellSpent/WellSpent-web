'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { compareByDisplayName, displayCategoryName, type NameableCategory } from '@/lib/categories/systemCategory'

/**
 * Returns the display name for a category in the active language.
 *
 * A hook rather than calling `displayCategoryName` with an inline
 * `useTranslations('budget.systemCategories')` in each of the ~15 components
 * that render a category: one namespace string repeated fifteen times is one
 * typo away from a `MISSING_MESSAGE` that only shows up when someone opens the
 * page (see `BudgetList`'s `auth.logout`, which shipped exactly that way).
 */
export function useCategoryName(): (cat: NameableCategory | null | undefined) => string {
  const t = useTranslations('budget.systemCategories')
  return useCallback((cat: NameableCategory | null | undefined) => displayCategoryName(cat, t), [t])
}

/**
 * Sorts categories by the name shown on screen.
 *
 * The server orders `ListCategories` by the English `name`, which stops being
 * the reader's order once system categories are translated — a Spanish user
 * would see an apparently unsorted list. Sorting is a display concern now, so
 * it belongs on the client alongside the translation that caused it.
 */
export function useSortedCategories<T extends NameableCategory>(categories: T[]): T[] {
  const t = useTranslations('budget.systemCategories')
  const locale = useLocale()
  return useMemo(
    () => [...categories].sort((a, b) => compareByDisplayName(a, b, t, locale)),
    [categories, t, locale],
  )
}
