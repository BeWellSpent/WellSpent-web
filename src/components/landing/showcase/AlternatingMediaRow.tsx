'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ShowcaseFrame } from './ShowcaseFrame'

type Props = {
  src: string
  title: string
  desc: string
  /** Puts the capture on the right at desktop widths. */
  reversed?: boolean
}

/**
 * A capture beside its explanation, alternating sides down the page.
 *
 * Shared by the landing showcase and the feature group pages — they were
 * about to grow the same layout independently.
 */
export function AlternatingMediaRow({ src, title, desc, reversed = false }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        // On mobile the capture always leads: the copy means little before
        // you've seen the view it describes.
        flexDirection: { xs: 'column', md: reversed ? 'row-reverse' : 'row' },
        alignItems: 'center',
        gap: { xs: 3, md: 6 },
        mb: { xs: 7, md: 10 },
        '&:last-of-type': { mb: 0 },
      }}
    >
      <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
        <ShowcaseFrame src={src} alt={title} placeholderLabel={title} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', md: 'left' } }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {desc}
        </Typography>
      </Box>
    </Box>
  )
}
