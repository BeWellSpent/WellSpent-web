/** The C# backend. The site makes one call: redeeming an email-verification link. */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5021'

export async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/rest/v1/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `verify-email failed with ${res.status}`)
  }
}
