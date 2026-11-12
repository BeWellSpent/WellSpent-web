import Box from '@mui/material/Box'
import { BrandLockup } from '../landing/BrandLockup'

/** A single centred card with the logo, for the pages email and sign-in links land on. */
export function StandalonePage({ icon, title, body, children }: {
  icon?: React.ReactNode
  title: string
  body: string
  children?: React.ReactNode
}) {
  return (
    <Box component="main" sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 }, bgcolor: 'background.paper', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <BrandLockup height={40} />
        {icon}
        <Box component="h1" sx={{ m: 0, fontSize: 28, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</Box>
        <Box component="p" sx={{ m: 0, fontSize: 16, lineHeight: 1.5, color: 'text.secondary' }}>{body}</Box>
        {children}
      </Box>
    </Box>
  )
}
