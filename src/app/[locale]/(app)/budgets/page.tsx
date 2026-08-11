import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import { BudgetList } from '@/components/budget/BudgetList'
import { AppVersionBadge } from '@/components/ui/AppVersionBadge'

export default function BudgetsPage() {
  return (
    <>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box>
          <BudgetList />
        </Box>
        <AppVersionBadge mt={4} />
      </Container>
    </>
  )
}
