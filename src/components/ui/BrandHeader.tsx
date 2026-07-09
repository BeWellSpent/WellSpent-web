'use client'

import Image from 'next/image'
import Box from '@mui/material/Box'
import { useThemeMode } from '@/context/ThemeContext'

export function BrandHeader() {
  const { effective } = useThemeMode()
  const src = effective === 'dark' ? '/web-header-dark.png' : '/web-header-light.png'
  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
      <Image
        src={src}
        alt="WellSpent"
        width={420}
        height={93}
        style={{ width: '100%', height: 'auto', maxWidth: 420 }}
        priority
      />
    </Box>
  )
}
