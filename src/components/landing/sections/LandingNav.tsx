'use client'

import { useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import Image from 'next/image'
import NextLink from 'next/link'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LanguageIcon from '@mui/icons-material/Language'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useThemeMode } from '@/context/ThemeContext'
import { routing } from '@/i18n/routing'
import { LOCALE_LABELS, NAV_SECTIONS, scrollToSection } from '../constants'
import { FEATURE_GROUPS } from '../features/featureGroups'

/** Shared by every top-level nav button so they can't drift in weight or size. */
const NAV_BUTTON_SX = {
  color: 'text.primary',
  fontWeight: 500,
  textTransform: 'none',
  fontSize: '0.95rem',
} as const

type Props = {
  /** Signed-in visitors get one route back into the app instead of two ways in. */
  isAuthenticated: boolean
}

export function LandingNav({ isAuthenticated }: Props) {
  const t = useTranslations('landing')
  const locale = useLocale()
  const isMobile = useIsMobile()
  const { effective } = useThemeMode()
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null)
  const [featuresAnchor, setFeaturesAnchor] = useState<null | HTMLElement>(null)
  const [featuresExpanded, setFeaturesExpanded] = useState(false)

  // Before mount, effective is 'light' (matches SSR). After mount, follows user preference.
  const iconSrc = mounted && effective === 'dark' ? '/app-icon-dark.png' : '/app-icon-light.png'

  useEffect(() => setMounted(true), [])

  /** Scrolls to a section and closes whatever opened it. */
  function navigateTo(id: string) {
    setFeaturesAnchor(null)
    setDrawerOpen(false)
    scrollToSection(id)
  }

  function switchLocale(newLocale: string) {
    setLangAnchor(null)
    const newPath = pathname.startsWith(`/${locale}`)
      ? `/${newLocale}${pathname.slice(`/${locale}`.length)}`
      : `/${newLocale}`
    router.push(newPath)
  }

  return (
    <>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{ bgcolor: 'background.paper', color: 'text.primary' }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Logo */}
          <Box
            component={NextLink}
            href={`/${locale}`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
          >
            {isMobile ? (
              <Image src={iconSrc} alt="WellSpent" width={36} height={36} style={{ objectFit: 'contain' }} />
            ) : (
              <Image src="/web-header.png" alt="WellSpent" width={160} height={36} style={{ objectFit: 'contain', objectPosition: 'left' }} />
            )}
          </Box>

          {/* Desktop: centered nav links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, mx: 'auto' }}>
              {NAV_SECTIONS.map(({ key, id }) =>
                key === 'features' ? (
                  <Button
                    key={key}
                    onClick={(e) => setFeaturesAnchor(e.currentTarget)}
                    endIcon={<ArrowDropDownIcon />}
                    sx={NAV_BUTTON_SX}
                  >
                    {t(`nav.${key}`)}
                  </Button>
                ) : (
                  <Button key={key} onClick={() => navigateTo(id)} sx={NAV_BUTTON_SX}>
                    {t(`nav.${key}`)}
                  </Button>
                ),
              )}
            </Box>
          )}

          {/* Features dropdown */}
          <Menu
            anchorEl={featuresAnchor}
            open={Boolean(featuresAnchor)}
            onClose={() => setFeaturesAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <MenuItem onClick={() => navigateTo('features')} sx={{ fontWeight: 600 }}>
              {t('nav.allFeatures')}
            </MenuItem>
            <Divider />
            {FEATURE_GROUPS.map((group) => (
              <MenuItem
                key={group.key}
                onClick={() => navigateTo(group.id)}
                sx={{ maxWidth: 340, whiteSpace: 'normal', alignItems: 'flex-start', py: 1 }}
              >
                <ListItemText
                  primary={t(`featureGroups.${group.key}.title`)}
                  secondary={t(`featureGroups.${group.key}.summary`)}
                  primaryTypographyProps={{ fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </MenuItem>
            ))}
          </Menu>

          {/* Language switcher + auth buttons (both breakpoints) */}
          <Box sx={{ display: 'flex', gap: 1, ml: isMobile ? 'auto' : 0, alignItems: 'center' }}>
            {/* Language switcher */}
            <Button
              onClick={(e) => setLangAnchor(e.currentTarget)}
              size="small"
              endIcon={<ArrowDropDownIcon />}
              startIcon={<LanguageIcon fontSize="small" />}
              sx={{ textTransform: 'uppercase', fontWeight: 600, color: 'text.secondary', minWidth: 0, px: 1 }}
            >
              {locale}
            </Button>
            <Menu
              anchorEl={langAnchor}
              open={Boolean(langAnchor)}
              onClose={() => setLangAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {routing.locales.map((l) => (
                <MenuItem
                  key={l}
                  selected={l === locale}
                  onClick={() => switchLocale(l)}
                  sx={{ minWidth: 120 }}
                >
                  {LOCALE_LABELS[l] ?? l.toUpperCase()}
                </MenuItem>
              ))}
            </Menu>

            {isAuthenticated ? (
              <Button
                component={NextLink}
                href={`/${locale}/budgets`}
                variant="contained"
                size={isMobile ? 'small' : 'medium'}
                sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {t('nav.openApp')}
              </Button>
            ) : (
              <>
                <Button
                  component={NextLink}
                  href={`/${locale}/login`}
                  variant="text"
                  sx={{ textTransform: 'none', fontWeight: 500, color: 'text.primary', whiteSpace: 'nowrap' }}
                >
                  {t('nav.signIn')}
                </Button>
                <Button
                  component={NextLink}
                  href={`/${locale}/register`}
                  variant="contained"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  {t('nav.getStarted')}
                </Button>
              </>
            )}
            {isMobile && (
              <IconButton
                onClick={() => setDrawerOpen(true)}
                aria-label={t('nav.menu')}
                size="small"
                sx={{ ml: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Image src={iconSrc} alt="WellSpent" width={32} height={32} style={{ objectFit: 'contain' }} />
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {NAV_SECTIONS.map(({ key, id }) =>
            key === 'features' ? (
              <Box key={key}>
                <ListItemButton onClick={() => setFeaturesExpanded((open) => !open)}>
                  <ListItemText primary={t(`nav.${key}`)} />
                  {featuresExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={featuresExpanded} unmountOnExit>
                  <List disablePadding>
                    <ListItemButton sx={{ pl: 4 }} onClick={() => navigateTo('features')}>
                      <ListItemText primary={t('nav.allFeatures')} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItemButton>
                    {FEATURE_GROUPS.map((group) => (
                      <ListItemButton key={group.key} sx={{ pl: 4 }} onClick={() => navigateTo(group.id)}>
                        <ListItemText
                          primary={t(`featureGroups.${group.key}.title`)}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ) : (
              <ListItemButton key={key} onClick={() => navigateTo(id)}>
                <ListItemText primary={t(`nav.${key}`)} />
              </ListItemButton>
            ),
          )}
        </List>
      </Drawer>
    </>
  )
}
