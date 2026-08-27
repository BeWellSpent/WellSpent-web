import { isProfileComplete } from '../isProfileComplete'

describe('isProfileComplete', () => {
  it('is incomplete without a country — the field no social sign-up supplies', () => {
    expect(isProfileComplete({ countryCode: '' })).toBe(false)
    expect(isProfileComplete({ countryCode: '   ' })).toBe(false)
  })

  it('is complete with a country', () => {
    expect(isProfileComplete({ countryCode: 'US' })).toBe(true)
    expect(isProfileComplete({ countryCode: 'AR' })).toBe(true)
  })

  // State and filing status are US-only. Requiring them would gate every
  // non-US account on a question with no valid answer.
  it('does not require US-only fields', () => {
    expect(isProfileComplete({ countryCode: 'ES' })).toBe(true)
  })
})
