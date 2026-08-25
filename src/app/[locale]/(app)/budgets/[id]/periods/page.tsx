import Container from '@mui/material/Container'
import { PeriodListPanel } from '@/components/budget/budgetList/PeriodListPanel'

export default async function BudgetPeriodsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Container maxWidth="md" sx={{ py: 4, px: { xs: 1, sm: 3 } }}>
      <PeriodListPanel budgetId={id} />
    </Container>
  )
}
