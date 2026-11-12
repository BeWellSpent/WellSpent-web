import Box from '@mui/material/Box'

/** The WellSpent lockup, ink on light and white on dark. */
export function BrandLockup({ height = 38 }: { height?: number }) {
  const width = Math.round((height * 900) / 200)
  const img = { height, width, objectFit: 'contain' as const, objectPosition: 'left center' }
  return (
    <>
      <Box
        component="img"
        src="/lockup-ink.png"
        alt="WellSpent"
        sx={{ ...img, display: 'block', '[data-mui-color-scheme="dark"] &': { display: 'none' } }}
      />
      <Box
        component="img"
        src="/lockup-white.png"
        alt="WellSpent"
        sx={{ ...img, display: 'none', '[data-mui-color-scheme="dark"] &': { display: 'block' } }}
      />
    </>
  )
}
