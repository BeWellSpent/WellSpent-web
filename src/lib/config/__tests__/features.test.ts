describe('isEnabled', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH
    jest.resetModules()
  })

  it('returns false when the env var is not set', () => {
    const { isEnabled } = require('../features')
    expect(isEnabled('googleAuth')).toBe(false)
  })

  it('returns false when the env var is set to a non-true value', () => {
    process.env.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH = '1'
    const { isEnabled } = require('../features')
    expect(isEnabled('googleAuth')).toBe(false)
  })

  it('returns true when the env var is exactly "true"', () => {
    process.env.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH = 'true'
    const { isEnabled } = require('../features')
    expect(isEnabled('googleAuth')).toBe(true)
  })
})
