import { VerifyEmailStatus } from '@/components/standalone/VerifyEmailStatus'

/** Where the verification email links to: `{FRONTEND_URL}/en/verify-email/{token}`. */
export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <VerifyEmailStatus token={token} />
}
