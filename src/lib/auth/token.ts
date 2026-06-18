export const TOKEN_COOKIE = 'spendsense_token'

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  // 7 days
  maxAge: 60 * 60 * 24 * 7,
}
