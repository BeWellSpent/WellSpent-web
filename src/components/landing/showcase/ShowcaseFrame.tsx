'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { isVideoAsset } from './showcaseAssets'

type Props = {
  src: string
  alt: string
  /** Shown inside the default placeholder while the capture is missing. */
  placeholderLabel: string
  /** Frame viewport ratio. Captures are letterboxed to fit, never cropped. */
  aspectRatio?: string
  /** Rendered instead of the default placeholder when the capture is missing. */
  fallback?: ReactNode
}

/**
 * A product capture presented inside window chrome.
 *
 * Two things it deliberately handles:
 *
 * - **A missing file renders a placeholder, not a broken image.** Captures are
 *   produced by hand and land in the repo separately from this code, so the
 *   page has to be publishable in the gap between the two.
 * - **Captures are contained, never cropped.** Screenshot dimensions vary with
 *   whatever window they were taken in; cropping to fill would silently cut
 *   content out of a marketing image.
 */
export function ShowcaseFrame({ src, alt, placeholderLabel, aspectRatio = '16 / 10', fallback }: Props) {
  const [failed, setFailed] = useState(false)
  const isVideo = isVideoAsset(src)

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 6,
        bgcolor: 'background.paper',
      }}
    >
      {/* Window chrome — makes a raw capture read as an intentional frame */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
          <Box key={color} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, opacity: 0.8 }} />
        ))}
      </Box>

      <Box sx={{ position: 'relative', width: '100%', aspectRatio, bgcolor: 'background.default' }}>
        {failed ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              px: 3,
              textAlign: 'center',
              color: 'text.disabled',
            }}
          >
            {fallback ?? (
              <>
                <ImageOutlinedIcon sx={{ fontSize: 40 }} />
                <Typography variant="body2" color="text.secondary">
                  {placeholderLabel}
                </Typography>
              </>
            )}
          </Box>
        ) : isVideo ? (
          <Box
            component="video"
            src={src}
            aria-label={alt}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setFailed(true)}
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'contain' }}
            onError={() => setFailed(true)}
          />
        )}
      </Box>
    </Box>
  )
}
