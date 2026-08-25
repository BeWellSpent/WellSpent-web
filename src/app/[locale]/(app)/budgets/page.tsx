import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { getTranslations } from 'next-intl/server'
import { BudgetHome } from '@/components/budget/BudgetHome'
import { AppVersionBadge } from '@/components/ui/AppVersionBadge'
import { AppLink } from '@/components/ui/AppLink'

export default async function BudgetsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('budget.list')

  return (
    <>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box>
          <BudgetHome />
        </Box>
        {/* The app's home screen is the one place a signed-in user can find
            their way back to the public site. */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <AppLink href={`/${locale}`} variant="caption" color="text.disabled" underline="hover">
            {t('aboutSite')}
          </AppLink>
        </Box>
        <AppVersionBadge mt={1} />
      </Container>
    </>
  )
}
