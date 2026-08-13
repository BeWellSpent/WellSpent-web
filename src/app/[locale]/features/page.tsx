import type { Metadata } from 'next'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { getTranslations } from 'next-intl/server'
import { FEATURE_GROUPS, featureGroupHref } from '@/components/landing/features/featureGroups'
import { FEATURE_GROUP_ICONS } from '@/components/landing/features/featureGroupIcons'
import { FeatureGroupCard } from '@/components/landing/features/FeatureGroupCard'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing')
  return { title: `${t('features.title')} — WellSpent` }
}

export default async function FeaturesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('landing')

  return (
    <Box sx={{ py: { xs: 6, sm: 10 } }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="h3" component="h1" fontWeight={800} gutterBottom>
            {t('features.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', fontWeight: 400 }}>
            {t('features.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {FEATURE_GROUPS.map((group) => (
            <Grid item xs={12} sm={6} key={group.key}>
              <FeatureGroupCard
                group={group}
                href={featureGroupHref(locale, group.key)}
                icon={FEATURE_GROUP_ICONS[group.key]}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
