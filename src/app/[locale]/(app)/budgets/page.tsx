import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import NextLink from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BudgetList } from '@/components/budget/BudgetList'
import { AppVersionBadge } from '@/components/ui/AppVersionBadge'

export default async function BudgetsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('budget.list')

  return (
    <>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box>
          <BudgetList />
        </Box>
        {/* The app's home screen is the one place a signed-in user can find
            their way back to the public site. */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Link
            component={NextLink}
            href={`/${locale}`}
            variant="caption"
            color="text.disabled"
            underline="hover"
          >
            {t('aboutSite')}
          </Link>
        </Box>
        <AppVersionBadge mt={1} />
      </Container>
    </>
  )
}
