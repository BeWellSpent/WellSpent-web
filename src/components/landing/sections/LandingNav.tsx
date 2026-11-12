'use client'

import Box from '@mui/material/Box'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { BrandLockup } from '../BrandLockup'
import { SECTION_IDS } from '../landingStyles'

const NAV_LINKS = [
  { key: 'howItWorks', id: SECTION_IDS.how },
  { key: 'features', id: SECTION_IDS.features },
  { key: 'pricing', id: SECTION_IDS.pricing },
  { key: 'download', id: SECTION_IDS.download },
] as const

const LINK_SX = {
  color: 'text.primary',
  opacity: 0.85,
  textDecoration: 'none',
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 15,
  fontWeight: 500,
  '&:hover': { opacity: 1 },
} as const

/** Sticky top bar: logo, section links (hidden on phones, where the page is a short scroll), language, Get the app. */
export function LandingNav() {
  const t = useTranslations('landing.nav')
  const locale = useLocale()

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Box
        component="nav"
        aria-label={t('label')}
        sx={{ maxWidth: 1160, mx: 'auto', px: '20px', py: 1.25, display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 3 } }}
      >
        <Box component="a" href="#top" aria-label={t('home')} sx={{ display: 'flex', alignItems: 'center', minHeight: 44 }}>
          {/* The square mark on phones: the full lockup and the buttons don't fit 320px. */}
          <Box component="img" src="/mark-color.png" alt="WellSpent" sx={{ display: { xs: 'block', sm: 'none' }, width: 36, height: 36 }} />
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <BrandLockup height={36} />
          </Box>
        </Box>
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, gap: 2.75 }}>
          {NAV_LINKS.map((link) => (
            <Box component="a" key={link.key} href={`#${link.id}`} sx={LINK_SX}>
              {t(link.key)}
            </Box>
          ))}
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            role="group"
            aria-label={t('language')}
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '2px', p: '3px', bgcolor: 'action.hover', borderRadius: '10px' }}
          >
            {routing.locales.map((l) => (
              <Box
                component={Link}
                key={l}
                href="/"
                locale={l}
                aria-current={l === locale ? 'true' : undefined}
                sx={{
                  height: 38,
                  minWidth: 44,
                  px: 1.25,
                  borderRadius: '7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  color: l === locale ? 'text.primary' : 'text.secondary',
                  bgcolor: l === locale ? 'background.paper' : 'transparent',
                  boxShadow: l === locale ? '0 1px 3px rgba(16,24,40,.14)' : 'none',
                }}
              >
                {l}
              </Box>
            ))}
          </Box>
          <Box
            component="a"
            href={`#${SECTION_IDS.download}`}
            sx={{ height: 44, px: { xs: 1.75, sm: 2.25 }, borderRadius: '12px', bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}
          >
            {t('getApp')}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
