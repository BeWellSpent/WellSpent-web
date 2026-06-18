import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_COOKIE, COOKIE_OPTIONS } from '@/lib/auth/token'

export async function POST(req: NextRequest) {
  const { token } = await req.json() as { token: string }

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(TOKEN_COOKIE, token, COOKIE_OPTIONS)
  return res
}
