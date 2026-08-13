import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { StatusBanner } from '@/components/status/StatusBanner'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* Above everything, and outside the auth boundary on purpose — an
          outage notice has to reach signed-out visitors too. */}
      <StatusBanner />
      {children}
    </NextIntlClientProvider>
  )
}
