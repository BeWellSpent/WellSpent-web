import type { StatusBanner } from '@/gen/wellspent/v1/status_pb'
import { StatusBannerSeverity } from '@/gen/wellspent/v1/common_pb'
import { bannerMessage, bannerTone, isDismissible } from '../severity'

function banner(overrides: Partial<StatusBanner> = {}): StatusBanner {
  return {
    id: 'b1',
    severity: StatusBannerSeverity.WARNING,
    messageEn: 'Bank syncing is delayed.',
    messageEs: 'La sincronización bancaria está retrasada.',
    ...overrides,
  } as StatusBanner
}

describe('bannerTone', () => {
  it('maps the three severities to green, yellow and red', () => {
    expect(bannerTone(StatusBannerSeverity.INFO)).toBe('success')
    expect(bannerTone(StatusBannerSeverity.WARNING)).toBe('warning')
    expect(bannerTone(StatusBannerSeverity.CRITICAL)).toBe('error')
  })

  it('falls back to warning for a severity this build does not know', () => {
    // Understating an unknown severity is the worse failure of the two, so an
    // unrecognised value must not render as the reassuring green one.
    expect(bannerTone(StatusBannerSeverity.UNSPECIFIED)).toBe('warning')
    expect(bannerTone(99 as StatusBannerSeverity)).toBe('warning')
  })
})

describe('isDismissible', () => {
  it('lets the reader close informational and warning banners', () => {
    expect(isDismissible(StatusBannerSeverity.INFO)).toBe(true)
    expect(isDismissible(StatusBannerSeverity.WARNING)).toBe(true)
  })

  it('pins a critical banner in place', () => {
    // A red banner is up because something is badly broken. One that can be
    // swiped away isn't doing its job.
    expect(isDismissible(StatusBannerSeverity.CRITICAL)).toBe(false)
  })
})

describe('bannerMessage', () => {
  it('uses the English text for an English reader', () => {
    expect(bannerMessage(banner(), 'en')).toBe('Bank syncing is delayed.')
  })

  it('uses the Spanish text for a Spanish reader', () => {
    expect(bannerMessage(banner(), 'es')).toBe('La sincronización bancaria está retrasada.')
  })

  it('matches a regional locale, not just the bare language code', () => {
    expect(bannerMessage(banner(), 'es-MX')).toBe('La sincronización bancaria está retrasada.')
  })

  it('falls back to English when the Spanish text was left empty', () => {
    // message_es is optional on the server — an operator posting mid-incident
    // shouldn't be blocked on writing Spanish, and English beats a blank bar.
    expect(bannerMessage(banner({ messageEs: '' }), 'es')).toBe('Bank syncing is delayed.')
  })

  it('treats whitespace-only Spanish as empty', () => {
    expect(bannerMessage(banner({ messageEs: '   ' }), 'es')).toBe('Bank syncing is delayed.')
  })
})
