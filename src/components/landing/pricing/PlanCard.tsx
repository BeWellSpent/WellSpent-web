import Box from '@mui/material/Box'
import CheckIcon from '@mui/icons-material/Check'

type Props = {
  name: string
  price: string
  per: string
  tagline: string
  items: string[]
  /** Pro's dark card and its "Coming soon" pill. */
  badge?: string
  dark?: boolean
}

/** One plan: name, price, a line, and what it includes. */
export function PlanCard({ name, price, per, tagline, items, badge, dark = false }: Props) {
  const muted = dark ? '#C3CAD6' : 'text.secondary'
  return (
    <Box
      component="article"
      aria-label={name}
      sx={{
        p: { xs: 3, sm: 3.5 },
        borderRadius: '22px',
        bgcolor: dark ? '#101828' : 'background.default',
        color: dark ? '#FFFFFF' : 'text.primary',
        border: dark ? 1 : 0,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.25,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box component="h3" sx={{ m: 0, fontSize: 22, fontWeight: 700 }}>{name}</Box>
          {badge && (
            <Box
              component="span"
              sx={{ height: 26, px: 1.25, borderRadius: '13px', bgcolor: '#2B3448', color: '#C3CAD6', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}
            >
              {badge}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
          <Box component="span" sx={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em' }}>{price}</Box>
          <Box component="span" sx={{ fontSize: 15, color: muted }}>{per}</Box>
        </Box>
        <Box component="p" sx={{ m: 0, fontSize: 15, color: muted }}>{tagline}</Box>
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25, fontSize: 15 }}>
        {items.map((item) => (
          <Box component="li" key={item} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
            <CheckIcon aria-hidden sx={{ fontSize: 18, mt: '2px', color: dark ? '#8EA2FF' : 'success.main' }} />
            <span>{item}</span>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
