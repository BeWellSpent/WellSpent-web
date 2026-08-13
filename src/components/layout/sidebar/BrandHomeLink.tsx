'use client'

import Image from 'next/image'
import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { useLocale, useTranslations } from 'next-intl'

type Props = {
  iconSrc: string
  /** Pixel size of the mark. Defaults to the 32px the sidebar and top bar use. */
  size?: number
}

/**
 * The app mark, linking out to the public site.
 *
 * Clicking a product logo to go "home" is the affordance people already reach
 * for, and the marketing page is otherwise unreachable from inside the app.
 *
 * This is a deliberate exit, not a bounce: the landing page no longer
 * redirects a signed-in visitor, so they stay there until they use its
 * top-right "Open app" button to come back.
 */
export function BrandHomeLink({ iconSrc, size = 32 }: Props) {
  const t = useTranslations('budget.sidebar')
  const locale = useLocale()

  return (
    <Tooltip title={t('website')}>
      <Box
        component={NextLink}
        href={`/${locale}`}
        aria-label={t('website')}
        sx={{
          display: 'flex',
          flexShrink: 0,
          borderRadius: 1,
          transition: 'opacity 0.15s',
          '&:hover': { opacity: 0.7 },
        }}
      >
        <Image src={iconSrc} alt="WellSpent" width={size} height={size} style={{ objectFit: 'contain' }} />
      </Box>
    </Tooltip>
  )
}
