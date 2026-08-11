'use client'

import NextLink from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'

type Props = {
  name: string
  price: string
  tagline: string
  features: readonly string[]
  /**
   * The plan's action. Omitted for a plan that can't be bought yet — a tier
   * with no price and no payment mechanism gets no button rather than a dead
   * one, and says "coming soon" where its price would be.
   */
  cta?: { label: string; href: string }
}

/**
 * One pricing plan. Sits on the section's solid primary background, so its
 * colours are fixed to the light-on-dark treatment rather than pulled from the
 * theme's text palette.
 */
export function PricingCard({ name, price, tagline, features, cta }: Props) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        border: '2px solid',
        borderColor: cta ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
        bgcolor: 'rgba(255,255,255,0.1)',
      }}
    >
      <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: 1 }}>
        {name}
      </Typography>
      <Typography variant="h3" fontWeight={800} color="white" sx={{ mb: 0.5 }}>
        {price}
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mb: 3 }}>
        {tagline}
      </Typography>

      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 3, textAlign: 'left', flexGrow: 1 }}>
        {features.map((feature) => (
          <Box
            component="li"
            key={feature}
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.25 }}
          >
            <CheckIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.9)', mt: '2px', flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
              {feature}
            </Typography>
          </Box>
        ))}
      </Box>

      {cta && (
        <Button
          component={NextLink}
          href={cta.href}
          variant="contained"
          size="large"
          fullWidth
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          {cta.label}
        </Button>
      )}
    </Card>
  )
}
