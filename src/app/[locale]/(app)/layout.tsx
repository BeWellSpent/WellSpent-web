import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TOKEN_COOKIE, isTokenExpired } from '@/lib/auth/token'
import { AuthProvider } from '@/context/AuthContext'
import { SnackbarProvider } from '@/components/ui/ErrorSnackbar'
import { EmailVerificationGate } from '@/components/auth/EmailVerificationGate'
import { WhatsNewDialog } from '@/components/changelog/WhatsNewDialog'

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const token = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!token || isTokenExpired(token)) redirect(`/${locale}/login`)

  return (
    <SnackbarProvider>
      <AuthProvider token={token}>
        <EmailVerificationGate>
          {/* Inside the gate on purpose: an unverified account is being told
              to verify, and a what's-new dialog on top of that is noise. */}
          <WhatsNewDialog />
          {children}
        </EmailVerificationGate>
      </AuthProvider>
    </SnackbarProvider>
  )
}
