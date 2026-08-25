'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import type { BudgetPeriod } from '@/gen/wellspent/v1/budget_pb'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CheckIcon from '@mui/icons-material/Check'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'

interface Props {
  budgetId: string
  periods: BudgetPeriod[]
  currentPeriodId?: string
  collapsed?: boolean
  onNavigate?: () => void
}

/** UTC because a period's dates are DATE-only columns pinned to midnight UTC. */
function periodLabel(period: BudgetPeriod, locale: string): string {
  if (!period.startDate) return ''
  return new Date(Number(period.startDate.seconds) * 1000).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Which period the budget view is showing, and a way to change it.
 *
 * Lists only the current period's own year. A budget accumulates twelve
 * periods a year forever, so the full history belongs on its own screen
 * (`/budgets/[id]/periods`) rather than in a nav panel that would grow
 * without bound. Mirrors iOS's `BudgetMenuSheet` period section.
 */
export function PeriodSwitcher({ budgetId, periods, currentPeriodId, collapsed = false, onNavigate }: Props) {
  const t = useTranslations('budget.sidebar')
  const locale = useLocale()
  const router = useRouter()

  // Collapsed the sidebar is icon-only and there is no room for dates; the
  // "all periods" entry still gets the user there.
  if (collapsed) return null

  const current = periods.find((p) => p.id === currentPeriodId)
  const currentYear = current?.startDate
    ? new Date(Number(current.startDate.seconds) * 1000).getUTCFullYear()
    : undefined
  const periodsThisYear = currentYear === undefined
    ? []
    : periods.filter(
        (p) => p.startDate && new Date(Number(p.startDate.seconds) * 1000).getUTCFullYear() === currentYear
      )

  function selectPeriod(period: BudgetPeriod) {
    logger.info('budget.period.switch', { budgetId, periodId: period.id })
    router.push(`/budgets/${budgetId}?period=${period.id}`)
    onNavigate?.()
  }

  function viewAll() {
    router.push(`/budgets/${budgetId}/periods`)
    onNavigate?.()
  }

  return (
    <Box>
      <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
        {t('period')}
      </Typography>
      <List dense disablePadding>
        {periodsThisYear.map((period) => (
          <ListItemButton
            key={period.id}
            selected={period.id === currentPeriodId}
            onClick={() => selectPeriod(period)}
          >
            <ListItemText primary={periodLabel(period, locale)} />
            {period.id === currentPeriodId ? (
              <CheckIcon fontSize="small" color="primary" />
            ) : period.isArchived ? (
              <Chip size="small" label={t('archived')} sx={{ height: 18, fontSize: '0.65rem' }} />
            ) : null}
          </ListItemButton>
        ))}
        <ListItemButton onClick={viewAll}>
          <ListItemIcon sx={{ minWidth: 36 }}><CalendarMonthIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('viewAllPeriods')} />
        </ListItemButton>
      </List>
    </Box>
  )
}
