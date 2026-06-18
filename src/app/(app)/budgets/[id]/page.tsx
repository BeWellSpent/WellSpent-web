import Container from '@mui/material/Container'
import { BudgetView } from '@/components/budget/BudgetView'

export default function BudgetPage({ params }: { params: { id: string } }) {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <BudgetView budgetId={params.id} />
    </Container>
  )
}
