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
import CallSplitIcon from '@mui/icons-material/CallSplit'
import UndoIcon from '@mui/icons-material/Undo'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

export interface MobileRowActionsProps {
  canMarkPaid: boolean
  isAlreadyPaid: boolean
  /** False when full mutation is blocked (archived period) — hides the
   * unmark action even though the row is factually already paid. */
  canUnmark: boolean
  unmarkPending: boolean
  canFlagForReview: boolean
  isExcluded: boolean
  canSplitIntoInstallments: boolean
  isInstallmentPlan: boolean
  isIncomeRow: boolean
  /** False when full mutation is blocked (archived period). */
  canExclude: boolean
  excludePending: boolean
  isRowEditable: boolean
  /** False when full mutation is blocked (archived period) — Edit stays
   * reachable via isRowEditable regardless, since a Variable transaction's
   * category can still change even then; only Delete is gated by this. */
  canDelete: boolean
  /** Plaid-imported transactions can never be deleted, regardless of canDelete. */
  isPlaidImported: boolean
  onMarkPaid: () => void
  onUnmark: () => void
  onFlagForReview: () => void
  onToggleExcluded: () => void
  onSplitIntoInstallments: () => void
  onUnsplitInstallments: () => void
  onEdit: () => void
  onDelete: () => void
}

// Up to five separate icon buttons (mark paid, flag for review, exclude,
// edit, delete) inline forced horizontal scrolling on narrow phone widths.
// Consolidating them behind a single "more" menu keeps every mobile row
// within the viewport.
export function MobileRowActions({
  canMarkPaid, isAlreadyPaid, canUnmark, unmarkPending, canFlagForReview, isExcluded, isIncomeRow, canExclude, excludePending,
  canSplitIntoInstallments, isInstallmentPlan, onSplitIntoInstallments, onUnsplitInstallments,
  isRowEditable, canDelete, isPlaidImported, onMarkPaid, onUnmark, onFlagForReview, onToggleExcluded, onEdit, onDelete,
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
        {isAlreadyPaid && canUnmark && (
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
        {isInstallmentPlan && (
          <MenuItem onClick={() => run(onUnsplitInstallments)}>
            <ListItemIcon><UndoIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('installments.unsplitAction')}</ListItemText>
          </MenuItem>
        )}
        {canSplitIntoInstallments && (
          <MenuItem onClick={() => run(onSplitIntoInstallments)}>
            <ListItemIcon><CallSplitIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('installments.action')}</ListItemText>
          </MenuItem>
        )}
        {canExclude && (isIncomeRow || isInstallmentPlan ? (
          <MenuItem disabled>
            <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{isInstallmentPlan ? t('installments.excludeLocked') : t('exclude.incomeAlwaysExcluded')}</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => run(onToggleExcluded)} disabled={excludePending}>
            <ListItemIcon>{isExcluded ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}</ListItemIcon>
            <ListItemText>{isExcluded ? t('exclude.unexclude') : t('exclude.exclude')}</ListItemText>
          </MenuItem>
        ))}
        {isRowEditable && (
          <MenuItem onClick={() => run(onEdit)}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('edit')}</ListItemText>
          </MenuItem>
        )}
        {isRowEditable && canDelete && (
          isPlaidImported ? (
            <MenuItem disabled>
              <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('deletePlaidLocked')}</ListItemText>
            </MenuItem>
          ) : (
            <MenuItem onClick={() => run(onDelete)}>
              <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('delete')}</ListItemText>
            </MenuItem>
          )
        )}
      </Menu>
    </>
  )
}
