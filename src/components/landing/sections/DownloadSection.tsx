'use client'

import Box from '@mui/material/Box'
import AndroidIcon from '@mui/icons-material/Android'
import AppleIcon from '@mui/icons-material/Apple'
import { useTranslations } from 'next-intl'
import { APP_STORE_URL } from '@/lib/appStore'
import { AppStoreButton } from '../AppStoreButton'
import { ANCHOR_SX, CONTAINER_SX, SECTION_IDS } from '../landingStyles'

const MUTED = '#C3CAD6'

function PlatformRow({ icon, name, status, pill, live }: { icon: React.ReactNode; name: string; status: string; pill: string; live: boolean }) {
  return (
    <Box sx={{ p: 2, px: 2.25, bgcolor: '#1D2536', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 1.75 }}>
      {icon}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        <Box component="span" sx={{ fontSize: 16, fontWeight: 600 }}>{name}</Box>
        <Box component="span" sx={{ fontSize: 14, color: MUTED }}>{status}</Box>
      </Box>
      <Box
        component="span"
        sx={{ height: 26, px: 1.25, borderRadius: '13px', bgcolor: live ? 'rgba(76,195,138,0.18)' : '#2B3448', color: live ? '#4CC38A' : MUTED, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}
      >
        {pill}
      </Box>
    </Box>
  )
}

/** Mobile only, and says so: there is no web app. */
export function DownloadSection() {
  const t = useTranslations('landing.download')
  const live = APP_STORE_URL !== ''
  return (
    <Box component="section" id={SECTION_IDS.download} aria-labelledby="download-title" sx={{ ...CONTAINER_SX, ...ANCHOR_SX, mb: 9 }}>
      <Box sx={{ p: { xs: 3, md: 7 }, bgcolor: '#101828', color: '#FFFFFF', borderRadius: '28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        <Box sx={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box component="img" src="/mark-color.png" alt="" sx={{ width: 64, height: 64 }} />
          <Box component="h2" id="download-title" sx={{ m: 0, fontSize: { xs: 30, md: 40 }, lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.025em' }}>
            {t('title')}
          </Box>
          <Box component="p" sx={{ m: 0, fontSize: 17, lineHeight: 1.5, color: MUTED }}>{t('body')}</Box>
          {live && <Box sx={{ mt: 1 }}><AppStoreButton /></Box>}
        </Box>
        <Box sx={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <PlatformRow
            icon={<AppleIcon aria-hidden />}
            name={t('iphone')}
            status={live ? t('iphoneLive') : t('iphoneSoon')}
            pill={live ? t('available') : t('soon')}
            live={live}
          />
          <PlatformRow icon={<AndroidIcon aria-hidden />} name={t('android')} status={t('androidStatus')} pill={t('later')} live={false} />
        </Box>
      </Box>
    </Box>
  )
}
