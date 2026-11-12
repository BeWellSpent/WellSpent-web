import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { COMPARISON_ROWS } from './plans'

const CELL_SX = { textAlign: 'left', px: 2.5, py: 1.6 } as const
const HEAD_SX = { ...CELL_SX, py: 1.5, fontSize: 13, color: 'text.secondary', fontWeight: 600 } as const

/** Free and Pro feature by feature; scrolls sideways on a phone rather than squashing. */
export function ComparisonTable() {
  const t = useTranslations('landing.pricing')
  return (
    <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: '18px' }}>
      <Box component="table" sx={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 15 }}>
        <Box component="caption" sx={{ textAlign: 'left', px: 2.5, pt: 2, pb: 1, fontSize: 17, fontWeight: 700 }}>
          {t('table.caption')}
        </Box>
        <thead>
          <Box component="tr" sx={{ bgcolor: 'background.default' }}>
            <Box component="th" scope="col" sx={HEAD_SX}>{t('table.feature')}</Box>
            <Box component="th" scope="col" sx={{ ...HEAD_SX, width: '26%' }}>{t('free.name')}</Box>
            <Box component="th" scope="col" sx={{ ...HEAD_SX, width: '26%' }}>{t('pro.name')}</Box>
          </Box>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <Box component="tr" key={row.key} sx={{ borderTop: 1, borderColor: 'divider' }}>
              <Box component="th" scope="row" sx={{ ...CELL_SX, fontWeight: 500 }}>{t(`rows.${row.key}.name`)}</Box>
              <Box component="td" sx={{ ...CELL_SX, color: 'none' in row ? 'text.disabled' : 'text.secondary' }}>
                {t(`rows.${row.key}.free`)}
              </Box>
              <Box component="td" sx={{ ...CELL_SX, fontWeight: 600 }}>{t(`rows.${row.key}.pro`)}</Box>
            </Box>
          ))}
        </tbody>
      </Box>
    </Box>
  )
}
