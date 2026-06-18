'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
  budgetId: string
}

function formatMoney(units: bigint, nanos: number): string {
  const total = Number(units) + nanos / 1e9
  return total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function IncomePanel({ budgetId }: Props) {
  const { showError } = useSnackbar()
  const client = useClient(BudgetService)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['income', budgetId],
    queryFn: () => client.listIncomeEntries({ budgetId }),
  })

  const { mutateAsync: doDelete } = useMutation({
    mutationFn: (id: bigint) => client.deleteIncomeEntry({ id, budgetId }),
  })

  async function handleDelete(id: bigint) {
    try {
      await doDelete(id)
      logger.info('income.delete', { budgetId, id: id.toString() })
      refetch()
    } catch (err) {
      showError(err)
    }
  }

  const entries = data?.entries ?? []
  const total = entries.reduce((sum, e) => sum + Number(e.amount?.units ?? 0) + (e.amount?.nanos ?? 0) / 1e9, 0)

  if (isLoading) return <CircularProgress size={20} />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>Income</Typography>
        <Typography variant="subtitle2" color="success.main">
          {total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} / mo
        </Typography>
      </Box>
      {entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No income entries yet.</Typography>
      ) : (
        <List dense disablePadding>
          {entries.map((entry) => (
            <ListItem
              key={entry.id.toString()}
              disableGutters
              secondaryAction={
                <IconButton size="small" onClick={() => handleDelete(entry.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={entry.name}
                secondary={formatMoney(entry.amount?.units ?? 0n, entry.amount?.nanos ?? 0)}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}
