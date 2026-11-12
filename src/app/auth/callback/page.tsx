import { getTranslations } from 'next-intl/server'
import { StandalonePage } from '@/components/standalone/StandalonePage'

/**
 * Google sign-in's redirect URI, shared with iOS. The app's sign-in session
 * intercepts the redirect before this renders; it only shows if opened directly.
 */
export default async function AuthCallbackPage() {
  const t = await getTranslations({ locale: 'en', namespace: 'standalone.callback' })
  return <StandalonePage title={t('title')} body={t('body')} />
}
