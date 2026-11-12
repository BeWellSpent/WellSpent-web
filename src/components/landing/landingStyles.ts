/** Section ids, shared by the nav and the sections they scroll to. */
export const SECTION_IDS = {
  how: 'how',
  features: 'features',
  pricing: 'pricing',
  download: 'download',
} as const

/** The 1160px column every section lays out in. */
export const CONTAINER_SX = { maxWidth: 1160, mx: 'auto', px: '20px' } as const

/** A full-width band on the card colour, separating sections like the app's grouped lists. */
export const BAND_SX = { bgcolor: 'background.paper', borderTop: 1, borderBottom: 1, borderColor: 'divider' } as const

export const EYEBROW_SX = { fontSize: 14, fontWeight: 600, color: 'primary.main' } as const

export const H2_SX = {
  m: 0,
  fontSize: { xs: 30, md: 40 },
  lineHeight: 1.1,
  fontWeight: 800,
  letterSpacing: '-0.025em',
} as const

/** Anchored sections clear the sticky header when scrolled to. */
export const ANCHOR_SX = { scrollMarginTop: '72px' } as const

/** The app's white card: rounded, no shadow, on the grouped background. */
export const CARD_SX = { bgcolor: 'background.paper', borderRadius: '20px', p: 3 } as const
