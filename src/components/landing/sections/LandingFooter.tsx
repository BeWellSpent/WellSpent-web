'use client'

import Image from 'next/image'
import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useLocale, useTranslations } from 'next-intl'
import { FEATURE_GROUPS, featureGroupHref } from '../features/featureGroups'

export function LandingFooter() {
  const t = useTranslations('landing')
  const locale = useLocale()

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 5,
        px: 3,
        bgcolor: '#111827',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Image src="/web-header.png" alt="WellSpent" width={140} height={31} style={{ objectFit: 'contain' }} />
      </Box>

      {/* The feature pages are otherwise only reachable through the nav
          dropdown, whose contents don't exist until it's opened — so nothing
          crawls them. These links are the durable path in. */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: { xs: 1.5, sm: 2.5 },
          mb: 2.5,
        }}
      >
        <Link
          component={NextLink}
          href={`/${locale}/features`}
          underline="hover"
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {t('nav.allFeatures')}
        </Link>
        {FEATURE_GROUPS.map((group) => (
          <Link
            key={group.key}
            component={NextLink}
            href={featureGroupHref(locale, group.key)}
            underline="hover"
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.65)' }}
          >
            {t(`featureGroups.${group.key}.title`)}
          </Link>
        ))}
      </Box>

      <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
        {t('footer.tagline')}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
        {t('footer.rights', { year: new Date().getFullYear() })}
      </Typography>
    </Box>
  )
}
