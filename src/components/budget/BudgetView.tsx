'use client'

import { useQuery } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { IncomePanel } from './IncomePanel'
import { PaymentMethodsPanel } from './PaymentMethodsPanel'
import { TransactionsPanel } from './TransactionsPanel'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

interface Props {
  budgetId: string
}

export function BudgetView({ budgetId }: Props) {
  const client = useClient(BudgetService)
  const { data, isLoading, error } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => client.getBudget({ id: budgetId }),
  })

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
  if (error) return <Typography color="error">Failed to load budget.</Typography>

  const budget = data?.budget

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>{budget?.name}</Typography>
        {budget?.startDate && budget?.endDate && (
          <Typography variant="body2" color="text.secondary">
            {String(budget.startDate)} — {String(budget.endDate)}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <IncomePanel budgetId={budgetId} />
        </Box>
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <PaymentMethodsPanel budgetId={budgetId} />
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <TransactionsPanel budgetId={budgetId} />
      </Box>
    </Box>
  )
}
