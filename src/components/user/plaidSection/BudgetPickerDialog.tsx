'use client'

import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { BudgetProfile } from '@/gen/wellspent/v1/budget_pb'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'

export function BudgetPickerDialog({
  open,
  budgets,
  onSelect,
  onClose,
}: {
  open: boolean
  budgets: BudgetProfile[]
  onSelect: (budgetId: string) => void
  onClose: () => void
}) {
  const t = useTranslations('settings.plaid')
  const fullScreen = useIsMobile()

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="xs" fullWidth>
      <DialogTitle>{t('pickBudget')}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {budgets.length === 0 ? (
          <Typography sx={{ p: 2 }} color="text.secondary" variant="body2">
            {t('noBudgets')}
          </Typography>
        ) : (
          <List disablePadding>
            {budgets.map((b) => (
              <ListItemButton key={b.id} onClick={() => onSelect(b.id)}>
                <ListItemText primary={b.name} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
      </DialogActions>
    </Dialog>
  )
}
