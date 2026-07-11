import Image from 'next/image'
import Box from '@mui/material/Box'

export function BrandHeader() {
  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
      <Image
        src="/web-header.png"
        alt="WellSpent"
        width={420}
        height={93}
        style={{ width: '100%', height: 'auto', maxWidth: 420 }}
        priority
      />
    </Box>
  )
}
