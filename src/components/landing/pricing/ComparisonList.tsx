import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { COMPARISON_ROWS } from './plans'

/** The comparison as stacked cards on phones, where a three-column table would scroll sideways. */
export function ComparisonList() {
  const t = useTranslations('landing.pricing')
  return (
    <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1 }}>
      <Box component="h3" sx={{ m: 0, mb: 0.5, fontSize: 17, fontWeight: 700 }}>{t('table.caption')}</Box>
      <Box component="dl" sx={{ m: 0, border: 1, borderColor: 'divider', borderRadius: '18px', overflow: 'hidden' }}>
        {COMPARISON_ROWS.map((row, index) => (
          <Box key={row.key} sx={{ px: 2, py: 1.5, borderTop: index === 0 ? 0 : 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box component="dt" sx={{ fontSize: 15, fontWeight: 600 }}>{t(`rows.${row.key}.name`)}</Box>
            <Box component="dd" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5, fontSize: 14 }}>
              <Box>
                <Box component="span" sx={{ display: 'block', fontSize: 12, color: 'text.secondary' }}>{t('free.name')}</Box>
                <Box component="span" sx={{ color: 'none' in row ? 'text.disabled' : 'text.primary' }}>{t(`rows.${row.key}.free`)}</Box>
              </Box>
              <Box>
                <Box component="span" sx={{ display: 'block', fontSize: 12, color: 'text.secondary' }}>{t('pro.name')}</Box>
                <Box component="span" sx={{ fontWeight: 600 }}>{t(`rows.${row.key}.pro`)}</Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
