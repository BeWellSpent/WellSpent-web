import {
  RESEND_COOLDOWN_MS,
  canSubmitEmailChange,
  isValidEmail,
  normalizeEmail,
} from '../verification'

describe('normalizeEmail', () => {
  it('lowercases and trims, matching what the backend stores', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com')
  })
})

describe('isValidEmail', () => {
  it.each(['ada@example.com', '  Ada@Example.COM  ', 'a.b+tag@sub.example.co.uk'])(
    'accepts %s',
    (email) => {
      expect(isValidEmail(email)).toBe(true)
    },
  )

  it.each(['', '   ', 'not-an-email', '@example.com', 'user@', 'user@example', 'a b@example.com'])(
    'rejects %s',
    (email) => {
      expect(isValidEmail(email)).toBe(false)
    },
  )
})

describe('canSubmitEmailChange', () => {
  it('allows a valid address that differs from the current one', () => {
    expect(canSubmitEmailChange('new@example.com', 'old@example.com')).toBe(true)
  })

  // The backend rejects an unchanged address rather than succeeding silently,
  // so this keeps the button disabled instead of spending a round trip on it.
  it('blocks the address already on the account', () => {
    expect(canSubmitEmailChange('same@example.com', 'same@example.com')).toBe(false)
  })

  it('blocks it regardless of casing or surrounding whitespace', () => {
    expect(canSubmitEmailChange('  SAME@Example.com ', 'same@example.com')).toBe(false)
  })

  it('blocks a malformed address', () => {
    expect(canSubmitEmailChange('nope', 'old@example.com')).toBe(false)
  })
})

describe('RESEND_COOLDOWN_MS', () => {
  it("matches the backend's 60-second resend throttle", () => {
    expect(RESEND_COOLDOWN_MS).toBe(60_000)
  })
})
