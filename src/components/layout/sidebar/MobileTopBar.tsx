'use client'

import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'

interface Props {
  title: string
  onOpenManage: () => void
  notificationBell?: React.ReactNode
}

/**
 * Mobile chrome: ☰ on the left, the current view's name in the middle, the
 * same action icons on the right.
 *
 * The back arrow is gone with the budget list it pointed at — the budget is
 * the home screen now (issue #60), so there is nowhere above it to go back
 * to. The brand mark went with it: the middle of the bar is more useful
 * naming what you are looking at, which is also what iOS does.
 */
export function MobileTopBar({ title, onOpenManage, notificationBell }: Props) {
  const t = useTranslations('budget.sidebar')

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <IconButton edge="start" onClick={onOpenManage} aria-label={t('manage')} sx={{ mr: 1 }}>
          <MenuIcon />
        </IconButton>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          noWrap
          sx={{ flex: 1, textAlign: 'center' }}
        >
          {title}
        </Typography>
        <ThemeToggle />
        {notificationBell}
      </Toolbar>
    </AppBar>
  )
}
