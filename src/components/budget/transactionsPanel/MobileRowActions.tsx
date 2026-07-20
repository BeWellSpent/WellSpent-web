'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FlagIcon from '@mui/icons-material/Flag'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

export interface MobileRowActionsProps {
  canMarkPaid: boolean
  isAlreadyPaid: boolean
  unmarkPending: boolean
  canFlagForReview: boolean
  isExcluded: boolean
  isIncomeRow: boolean
  excludePending: boolean
  isRowEditable: boolean
  onMarkPaid: () => void
  onUnmark: () => void
  onFlagForReview: () => void
  onToggleExcluded: () => void
  onEdit: () => void
  onDelete: () => void
}

// Up to five separate icon buttons (mark paid, flag for review, exclude,
// edit, delete) inline forced horizontal scrolling on narrow phone widths.
// Consolidating them behind a single "more" menu keeps every mobile row
// within the viewport.
export function MobileRowActions({
  canMarkPaid, isAlreadyPaid, unmarkPending, canFlagForReview, isExcluded, isIncomeRow, excludePending,
  isRowEditable, onMarkPaid, onUnmark, onFlagForReview, onToggleExcluded, onEdit, onDelete,
}: MobileRowActionsProps) {
  const t = useTranslations('budget.transactions')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  function close() {
    setAnchorEl(null)
  }
  function run(action: () => void) {
    close()
    action()
  }

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} aria-label={t('rowActions')}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={close}>
        {canMarkPaid && (
          <MenuItem onClick={() => run(onMarkPaid)}>
            <ListItemIcon><CheckCircleOutlineIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('markAsPaid.title')}</ListItemText>
          </MenuItem>
        )}
        {isAlreadyPaid && (
          <MenuItem onClick={() => run(onUnmark)} disabled={unmarkPending}>
            <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>{t('markAsPaid.unmark')}</ListItemText>
          </MenuItem>
        )}
        {canFlagForReview && (
          <MenuItem onClick={() => run(onFlagForReview)}>
            <ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('markForReview')}</ListItemText>
          </MenuItem>
        )}
        {isIncomeRow ? (
          <MenuItem disabled>
            <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('exclude.incomeAlwaysExcluded')}</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => run(onToggleExcluded)} disabled={excludePending}>
            <ListItemIcon>{isExcluded ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}</ListItemIcon>
            <ListItemText>{isExcluded ? t('exclude.unexclude') : t('exclude.exclude')}</ListItemText>
          </MenuItem>
        )}
        {isRowEditable && (
          <MenuItem onClick={() => run(onEdit)}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('edit')}</ListItemText>
          </MenuItem>
        )}
        {isRowEditable && (
          <MenuItem onClick={() => run(onDelete)}>
            <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('delete')}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
