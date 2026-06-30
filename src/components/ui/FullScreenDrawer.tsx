'use client'

import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function FullScreenDrawer({ open, onClose, title, children }: Props) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column' } }}
    >
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton edge="start" onClick={onClose} sx={{ mr: 1 }} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">{title}</Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {children}
      </Box>
    </Drawer>
  )
}
