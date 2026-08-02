'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { logger } from '@/lib/logger'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import type { BudgetPeriod } from '@/gen/wellspent/v1/budget_pb'

interface Props {
  profileId: string
  period: BudgetPeriod
}

export function PeriodRow({ profileId, period }: Props) {
  const t = useTranslations('budget.list')
  const router = useRouter()

  const label = period.startDate
    ? new Date(Number(period.startDate.seconds) * 1000).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : ''

  function handleClick() {
    logger.info('budget.open', { budgetId: profileId, periodId: period.id, isArchived: period.isArchived })
    router.push(`/budgets/${profileId}?period=${period.id}`)
  }

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardActionArea onClick={handleClick}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body1">{label}</Typography>
          <Box>
            <Chip
              size="small"
              label={period.isArchived ? t('archived') : t('active')}
              color={period.isArchived ? 'default' : 'success'}
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
