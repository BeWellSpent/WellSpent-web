'use client'

import { useRef } from 'react'
import { COLORS, COLOR_NAMES, isPresetColor } from '@/lib/config/colors'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import CheckIcon from '@mui/icons-material/Check'
import ColorizeIcon from '@mui/icons-material/Colorize'

interface Props {
  value: string
  onChange: (hex: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isCustom = value !== '' && !isPresetColor(value)

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Preset swatches */}
      {COLOR_NAMES.map((name) => {
        const hex = COLORS[name]
        const selected = value === hex
        return (
          <Tooltip key={name} title={name}>
            <Box
              onClick={() => onChange(hex)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: hex,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid',
                borderColor: selected ? 'text.primary' : 'transparent',
                transition: 'transform 0.1s',
                flexShrink: 0,
                '&:hover': { transform: 'scale(1.15)' },
              }}
            >
              {selected && <CheckIcon sx={{ fontSize: 16, color: 'white' }} />}
            </Box>
          </Tooltip>
        )
      })}

      {/* Custom color button — shows dropper icon, or the custom color when one is active */}
      <Tooltip title={isCustom ? `Custom: ${value}` : 'Custom color'}>
        <Box
          onClick={() => inputRef.current?.click()}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: isCustom ? value : 'transparent',
            border: '2px solid',
            borderColor: isCustom ? 'text.primary' : 'text.disabled',
            borderStyle: isCustom ? 'solid' : 'dashed',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.1s',
            '&:hover': { transform: 'scale(1.15)' },
          }}
        >
          {isCustom
            ? <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
            : <ColorizeIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          }
        </Box>
      </Tooltip>

      {/* Hidden native color input */}
      <input
        ref={inputRef}
        type="color"
        value={value || '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />
    </Box>
  )
}
