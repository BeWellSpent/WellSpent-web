import type { StatusBanner, StatusBannerSeverity } from '@/lib/api/restModels'

/** MUI severity keys, so the banner inherits the theme's own palette. */
export type BannerTone = 'success' | 'warning' | 'error'

/**
 * green / yellow / red, per the spec.
 *
 * An unrecognised severity falls back to `warning` rather than `success`: if
 * the server sends something this build doesn't know about, understating it is
 * the worse failure.
 */
export function bannerTone(severity: StatusBannerSeverity): BannerTone {
  switch (severity) {
    case 'info':
      return 'success'
    case 'critical':
      return 'error'
    default:
      return 'warning'
  }
}

/**
 * Critical banners can't be dismissed.
 *
 * A red banner is up because something is badly broken; one the user can swipe
 * away isn't doing its job. Green and yellow are informational enough that
 * forcing them to stay would just be noise.
 */
export function isDismissible(severity: StatusBannerSeverity): boolean {
  return severity !== 'critical'
}

/**
 * Picks the message for the reader's locale, falling back to English.
 *
 * `message_es` is optional on the server — an operator posting at 2am should
 * not be blocked on writing Spanish, and English text beats a blank bar.
 */
export function bannerMessage(banner: StatusBanner, locale: string): string {
  if (locale.startsWith('es') && banner.messageEs.trim() !== '') {
    return banner.messageEs
  }
  return banner.messageEn
}
