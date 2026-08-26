import type { StatusBanner, StatusBannerSeverity } from '@/lib/api/restModels'
import { bannerMessage, bannerTone, isDismissible } from '../severity'

function banner(overrides: Partial<StatusBanner> = {}): StatusBanner {
  return {
    id: 'b1',
    severity: 'warning',
    messageEn: 'Bank syncing is delayed.',
    messageEs: 'La sincronización bancaria está retrasada.',
    ...overrides,
  } as StatusBanner
}

describe('bannerTone', () => {
  it('maps the three severities to green, yellow and red', () => {
    expect(bannerTone('info')).toBe('success')
    expect(bannerTone('warning')).toBe('warning')
    expect(bannerTone('critical')).toBe('error')
  })

  it('falls back to warning for a severity this build does not know', () => {
    // Understating an unknown severity is the worse failure of the two, so an
    // unrecognised value must not render as the reassuring green one. The cast
    // stands in for a severity added to the contract after this build shipped —
    // the string union makes that unrepresentable in typed code, which is an
    // improvement over the proto enum, but the runtime guard still has to hold.
    expect(bannerTone('catastrophic' as StatusBannerSeverity)).toBe('warning')
  })
})

describe('isDismissible', () => {
  it('lets the reader close informational and warning banners', () => {
    expect(isDismissible('info')).toBe(true)
    expect(isDismissible('warning')).toBe(true)
  })

  it('pins a critical banner in place', () => {
    // A red banner is up because something is badly broken. One that can be
    // swiped away isn't doing its job.
    expect(isDismissible('critical')).toBe(false)
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
