import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getTranslations } from 'next-intl/server'
import { TOKEN_COOKIE, isTokenExpired } from '@/lib/auth/token'
import { AppLink, AppLinkButton } from '@/components/ui/AppLink'
import { findFeatureGroup } from '@/components/landing/features/featureGroups'
import { FEATURE_GROUP_ICONS } from '@/components/landing/features/featureGroupIcons'
import { AlternatingMediaRow } from '@/components/landing/showcase/AlternatingMediaRow'

type PageParams = { params: Promise<{ locale: string; group: string }> }

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { group } = await params
  // Guarded before translating: an unknown segment has no key to look up, and
  // next-intl throws rather than returning undefined.
  if (!findFeatureGroup(group)) return {}
  const t = await getTranslations('landing')
  return {
    title: `${t(`featureGroups.${group}.title`)} — WellSpent`,
    description: t(`featureGroups.${group}.summary`),
  }
}

export default async function FeatureGroupPage({ params }: PageParams) {
  const { locale, group: groupKey } = await params
  const group = findFeatureGroup(groupKey)
  if (!group) notFound()

  const t = await getTranslations('landing')
  const token = (await cookies()).get(TOKEN_COOKIE)?.value
  const isAuthenticated = token ? !isTokenExpired(token) : false

  const withCapture = group.items.filter((item) => item.capture)
  const withoutCapture = group.items.filter((item) => !item.capture)

  return (
    <Box sx={{ py: { xs: 5, sm: 8 } }}>
      <Container maxWidth="lg">
        <AppLink
          href={`/${locale}/features`}
          underline="hover"
          color="text.secondary"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 4 }}
        >
          <ArrowBackIcon fontSize="small" />
          <Typography variant="body2">{t('nav.allFeatures')}</Typography>
        </AppLink>

        <Box sx={{ maxWidth: 760, mb: { xs: 6, md: 9 } }}>
          <Box sx={{ color: 'primary.main', mb: 2, display: 'flex' }}>
            {FEATURE_GROUP_ICONS[group.key]}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
            <Typography variant="h3" component="h1" fontWeight={800}>
              {t(`featureGroups.${group.key}.title`)}
            </Typography>
            {group.comingSoon && (
              <Chip label={t('featureGroups.comingSoon')} variant="outlined" />
            )}
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.7 }}>
            {t(`featureGroups.${group.key}.summary`)}
          </Typography>
        </Box>

        {/* Items that have a capture get the full alternating treatment. */}
        {withCapture.map((item, index) => (
          <AlternatingMediaRow
            key={item.key}
            src={item.capture as string}
            title={t(`featureGroups.${group.key}.items.${item.key}.title`)}
            desc={t(`featureGroups.${group.key}.items.${item.key}.desc`)}
            reversed={index % 2 === 1}
          />
        ))}

        {/* The rest read better as a plain grid than as empty frames. */}
        {withoutCapture.length > 0 && (
          <Grid container spacing={4} sx={{ mt: withCapture.length > 0 ? { xs: 6, md: 8 } : 0 }}>
            {withoutCapture.map((item) => (
              <Grid item xs={12} sm={6} key={item.key}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {t(`featureGroups.${group.key}.items.${item.key}.title`)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {t(`featureGroups.${group.key}.items.${item.key}.desc`)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ textAlign: 'center', mt: { xs: 8, md: 12 } }}>
          <AppLinkButton
            href={isAuthenticated ? `/${locale}/budgets` : `/${locale}/register`}
            variant="contained"
            size="large"
            sx={{ textTransform: 'none', fontWeight: 700, px: 5 }}
          >
            {isAuthenticated ? t('nav.openApp') : t('hero.cta')}
          </AppLinkButton>
        </Box>
      </Container>
    </Box>
  )
}
