'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { Transaction, Category, PaymentMethod, BudgetPerson } from '@/gen/spendsense/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { useViewPreference } from '@/hooks/useViewPreference'
import { logger } from '@/lib/logger'
import { AddTransactionModal } from './modals/AddTransactionModal'
import { EditTransactionModal } from './modals/EditTransactionModal'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableFooter from '@mui/material/TableFooter'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import TabIcon from '@mui/icons-material/Tab'
import type { ViewMode } from '@/hooks/useViewPreference'

interface Props {
  budgetPeriodId: string
  budgetProfileId: string
  isEditable?: boolean
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatDate(ts: { seconds: bigint } | undefined): string {
  if (!ts || ts.seconds === 0n) return '—'
  return new Date(Number(ts.seconds) * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function txAmount(t: Transaction): number {
  return Number(t.amount?.units ?? 0n) + (t.amount?.nanos ?? 0) / 1e9
}

interface TableProps {
  transactions: Transaction[]
  isLoading: boolean
  isEditable: boolean
  label: string
  categoryMap: Map<number, Category>
  methodMap: Map<string, PaymentMethod>
  personMap: Map<string, BudgetPerson>
  onDeleted: () => void
  onEdit: (t: Transaction) => void
}

function TransactionTable({
  transactions,
  isLoading,
  isEditable,
  label,
  categoryMap,
  methodMap,
  personMap,
  onDeleted,
  onEdit,
}: TableProps) {
  const { showError } = useSnackbar()
  const client = useClient(BudgetService)

  const { mutateAsync: doDelete } = useMutation({
    mutationFn: (id: string) => client.deleteTransaction({ id }),
  })

  async function handleDelete(id: string) {
    try {
      await doDelete(id)
      logger.info('transaction.delete', { id })
      onDeleted()
    } catch (err) {
      showError(err)
    }
  }

  const total = transactions.reduce((sum, t) => sum + txAmount(t), 0)
  const colSpan = isEditable ? 7 : 6

  if (isLoading) return <CircularProgress size={20} />

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 560 }}>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Day</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Payment Method</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell align="right">Amount</TableCell>
            {isEditable && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                No {label.toLowerCase()} transactions yet.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((t) => {
              const category = t.categoryId ? categoryMap.get(t.categoryId) : undefined
              const method = t.paymentMethodId ? methodMap.get(t.paymentMethodId) : undefined
              const person = method?.budgetPersonId && method.budgetPersonId !== 0n
                ? personMap.get(method.budgetPersonId.toString())
                : undefined
              const personName = person?.userName

              return (
                <TableRow key={t.id} hover>
                  <TableCell>{t.name}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(t.date)}</TableCell>
                  <TableCell>
                    {category
                      ? <Chip label={category.name} size="small" sx={category.color ? { bgcolor: category.color, color: 'white' } : {}} />
                      : <Typography variant="body2" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    {method
                      ? <Chip label={method.name} size="small" sx={method.color ? { bgcolor: method.color, color: 'white' } : {}} />
                      : <Typography variant="body2" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    {personName
                      ? <Chip label={personName} size="small" sx={person?.color ? { bgcolor: person.color, color: 'white' } : {}} />
                      : <Typography variant="body2" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {formatMoney(txAmount(t))}
                  </TableCell>
                  {isEditable && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <IconButton size="small" onClick={() => onEdit(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(t.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
        </TableBody>
        {transactions.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell
                colSpan={isEditable ? 5 : 4}
                align="right"
                sx={{ fontWeight: 700, color: 'text.primary', borderTop: 2, borderColor: 'divider' }}
              >
                {label} subtotal
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 700, color: 'text.primary', borderTop: 2, borderColor: 'divider', whiteSpace: 'nowrap' }}
              >
                {formatMoney(total)}
              </TableCell>
              {isEditable && <TableCell sx={{ borderTop: 2, borderColor: 'divider' }} />}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </Box>
  )
}

export function TransactionsPanel({ budgetPeriodId, budgetProfileId, isEditable = true }: Props) {
  const queryClient = useQueryClient()
  const client = useClient(BudgetService)
  const [viewMode, setViewMode] = useViewPreference('tabbed')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [tabIndex, setTabIndex] = useState(0)

  const { data: fixedData, isLoading: fixedLoading } = useQuery({
    queryKey: ['transactions', budgetPeriodId, 1],
    queryFn: () => client.listTransactions({ budgetPeriodId, transactionTypeId: 1 }),
  })
  const { data: variableData, isLoading: variableLoading } = useQuery({
    queryKey: ['transactions', budgetPeriodId, 2],
    queryFn: () => client.listTransactions({ budgetPeriodId, transactionTypeId: 2 }),
  })
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => client.listCategories({}),
  })
  const { data: methodsData } = useQuery({
    queryKey: ['paymentMethods', budgetProfileId],
    queryFn: () => client.listPaymentMethods({ budgetProfileId }),
  })
  const { data: peopleData } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })

  const categoryMap = new Map((categoriesData?.categories ?? []).map((c) => [c.id, c]))
  const methodMap = new Map((methodsData?.methods ?? []).map((m) => [m.id, m]))
  const personMap = new Map((peopleData?.people ?? []).map((p) => [p.id.toString(), p]))

  const fixedTxs = fixedData?.transactions ?? []
  const variableTxs = variableData?.transactions ?? []
  const fixedTotal = fixedTxs.reduce((sum, t) => sum + txAmount(t), 0)
  const variableTotal = variableTxs.reduce((sum, t) => sum + txAmount(t), 0)
  const grandTotal = fixedTotal + variableTotal

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['transactions', budgetPeriodId] })

  const sharedTableProps = { isEditable, categoryMap, methodMap, personMap, onDeleted: refresh, onEdit: setEditTarget }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Transactions</Typography>
          {grandTotal > 0 && (
            <Typography variant="subtitle2" color="text.secondary">
              {formatMoney(grandTotal)} total
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(_, v: ViewMode) => v && setViewMode(v)}
          >
            <ToggleButton value="tabbed"><TabIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="split"><ViewStreamIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          {isEditable && (
            <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setAddOpen(true)}>
              Add
            </Button>
          )}
        </Box>
      </Box>

      {viewMode === 'tabbed' ? (
        <>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 1 }}>
            <Tab label={fixedTxs.length ? `Fixed · ${formatMoney(fixedTotal)}` : 'Fixed'} />
            <Tab label={variableTxs.length ? `Variable · ${formatMoney(variableTotal)}` : 'Variable'} />
          </Tabs>
          {tabIndex === 0
            ? <TransactionTable {...sharedTableProps} transactions={fixedTxs} isLoading={fixedLoading} label="Fixed" />
            : <TransactionTable {...sharedTableProps} transactions={variableTxs} isLoading={variableLoading} label="Variable" />
          }
        </>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>FIXED</Typography>
            <TransactionTable {...sharedTableProps} transactions={fixedTxs} isLoading={fixedLoading} label="Fixed" />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>VARIABLE</Typography>
            <TransactionTable {...sharedTableProps} transactions={variableTxs} isLoading={variableLoading} label="Variable" />
          </Box>
        </Box>
      )}

      {isEditable && (
        <AddTransactionModal
          budgetPeriodId={budgetPeriodId}
          budgetProfileId={budgetProfileId}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onDone={() => { setAddOpen(false); refresh() }}
        />
      )}

      {editTarget && (
        <EditTransactionModal
          budgetProfileId={budgetProfileId}
          transaction={editTarget}
          onClose={() => setEditTarget(null)}
          onDone={() => { setEditTarget(null); refresh() }}
        />
      )}
    </Box>
  )
}
