/**
 * Marketing captures live in `public/showcase/`.
 *
 * Paths are collected here so re-exporting or renaming a capture is a one-line
 * change rather than a hunt through the section components. Every frame
 * degrades to a captioned placeholder when its file is absent (see
 * `ShowcaseFrame`), so a capture that hasn't been taken yet never ships as a
 * broken image.
 */
const BASE = '/showcase'

export const SHOWCASE = {
  /** Expense Overview — actual spend per category. */
  overview: `${BASE}/overview.png`,
  /** Expense Plan — planned per-category amounts. */
  plan: `${BASE}/plan.png`,
  /** Transactions → Fixed tab, unpaid/paid split. */
  fixed: `${BASE}/fixed.png`,
  /** Transactions → Variable tab. */
  variable: `${BASE}/variable.png`,
  /** To Review tab — backs the auto-matching highlight. */
  review: `${BASE}/review.png`,
  /** Budget people and roles — backs the shared-budget highlight. */
  people: `${BASE}/people.png`,
} as const

/**
 * Optional per-use-case clips. `.mp4`/`.webm` render as muted looping video,
 * anything else as a still; when a file is missing the use case falls back to
 * its icon, so these are additive rather than required.
 */
export const USE_CASE_CLIPS = [
  `${BASE}/use-case-1.mp4`,
  `${BASE}/use-case-2.mp4`,
  `${BASE}/use-case-3.mp4`,
] as const

const VIDEO_EXTENSIONS = ['.mp4', '.webm']

export function isVideoAsset(src: string): boolean {
  const path = src.toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext))
}
