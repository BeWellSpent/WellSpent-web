import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'

const ACCENT = '#2F4BD8'
const CARD = { p: 1.75, bgcolor: '#FFFFFF', borderRadius: '16px' } as const
const ROW = { display: 'flex', justifyContent: 'space-between', fontSize: 12 } as const

function PersonCard({ initial, name, spent, pct, over, status, avatarBg, avatarFg }: {
  initial: string; name: string; spent: string; pct: number; over: boolean; status: string; avatarBg: string; avatarFg: string
}) {
  return (
    <Box sx={{ ...CARD, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 12, fontWeight: 600 }}>
        <Box sx={{ width: 20, height: 20, borderRadius: '10px', bgcolor: avatarBg, color: avatarFg, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {initial}
        </Box>
        {name}
      </Box>
      <Box sx={{ fontSize: 18, fontWeight: 700 }}>{spent}</Box>
      <Box sx={{ height: 6, borderRadius: '3px', bgcolor: '#EEF0F3' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '3px', bgcolor: over ? '#C2361F' : ACCENT }} />
      </Box>
      <Box sx={{ fontSize: 11, fontWeight: 600, color: over ? '#C2361F' : '#0B7A4B' }}>{status}</Box>
    </Box>
  )
}

/** A drawing of the app's Home screen; decorative, so hidden from assistive tech. */
export function PhoneMockup() {
  const t = useTranslations('landing.hero.mockup')
  return (
    <Box aria-hidden sx={{ width: 320, maxWidth: '100%', p: 1.5, borderRadius: '48px', bgcolor: '#101828', boxShadow: '0 30px 60px rgba(16,24,40,.22)' }}>
      <Box sx={{ borderRadius: '38px', bgcolor: '#F4F5F7', color: '#101828', pt: 3.5, px: 1.75, pb: 2.25, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', px: 0.5 }}>
          <Box sx={{ fontSize: 13, fontWeight: 600 }}>{t('month')}</Box>
          <Box sx={{ fontSize: 11, color: '#5D6679' }}>{t('daysLeft')}</Box>
        </Box>
        <Box sx={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', px: 0.5 }}>{t('home')}</Box>
        <Box sx={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Box sx={{ display: 'flex', height: 8, borderRadius: '4px', overflow: 'hidden', gap: '2px', bgcolor: '#EEF0F3' }}>
            <Box sx={{ width: '62%', bgcolor: ACCENT }} />
            <Box sx={{ width: '14%', bgcolor: '#0B7A4B' }} />
          </Box>
          <Box sx={ROW}><span>{t('plannedIncome')}</span><strong>$8,300</strong></Box>
          <Box sx={{ ...ROW, color: '#344054' }}><span>{t('plannedExpenses')}</span><strong>$5,140</strong></Box>
          <Box sx={{ ...ROW, color: '#344054' }}><span>{t('savings')}</span><strong>$1,160</strong></Box>
          <Box sx={{ ...ROW, pt: 1, borderTop: '1px solid #EEF0F3' }}>
            <Box component="span" sx={{ color: '#5D6679' }}>{t('notPlanned')}</Box>
            <Box component="strong" sx={{ color: '#0B7A4B' }}>$2,000</Box>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
          <PersonCard initial="M" name="Mauricio" spent="$1,388" pct={77} over={false} status={t('onTrack')} avatarBg="#E7EEFC" avatarFg={ACCENT} />
          <PersonCard initial="S" name="Sam" spent="$1,586" pct={100} over status={t('overBy')} avatarBg="#F0EBFB" avatarFg="#6B4FD0" />
        </Box>
        <Box sx={{ ...CARD, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', height: 10, borderRadius: '5px', overflow: 'hidden', gap: '2px' }}>
            {[['34%', ACCENT], ['22%', '#0B6E69'], ['18%', '#C97A0A'], ['14%', '#6B4FD0'], ['12%', '#98A1B2']].map(([w, c]) => (
              <Box key={c} sx={{ width: w, bgcolor: c }} />
            ))}
          </Box>
          <Box sx={{ fontSize: 11, color: '#C2361F', fontWeight: 600 }}>{t('overPlan')}</Box>
        </Box>
      </Box>
    </Box>
  )
}
