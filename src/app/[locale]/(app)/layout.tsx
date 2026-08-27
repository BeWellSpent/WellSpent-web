import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TOKEN_COOKIE, isTokenExpired } from '@/lib/auth/token'
import { AuthProvider } from '@/context/AuthContext'
import { SnackbarProvider } from '@/components/ui/ErrorSnackbar'
import { EmailVerificationGate } from '@/components/auth/EmailVerificationGate'
import { ProfileCompletionGate } from '@/components/auth/ProfileCompletionGate'
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
          {/* Nested rather than parallel so an account missing both is asked
              one thing at a time. In practice only social sign-ups reach the
              profile gate, and those are verified at creation. */}
          <ProfileCompletionGate>
            {/* Inside the gates on purpose: an account being told to verify
                or to finish its profile does not also need a what's-new
                dialog on top. */}
            <WhatsNewDialog />
            {children}
          </ProfileCompletionGate>
        </EmailVerificationGate>
      </AuthProvider>
    </SnackbarProvider>
  )
}
