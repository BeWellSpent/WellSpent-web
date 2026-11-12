import { getTranslations } from 'next-intl/server'
import { AppStoreButton } from '@/components/landing/AppStoreButton'
import { StandalonePage } from '@/components/standalone/StandalonePage'

/**
 * Where an invite email links to. With the app installed, iOS opens the link in
 * the app (apple-app-site-association), so this only shows without it.
 */
export default async function InvitePage() {
  const t = await getTranslations('standalone.invite')
  return (
    <StandalonePage title={t('title')} body={t('body')}>
      <AppStoreButton />
    </StandalonePage>
  )
}
