'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useClient } from '@/hooks/useClient'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { IncomeSource } from '@/gen/wellspent/v1/budget_pb'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { useIncomeSources, incomeSourcesQueryKey } from '@/hooks/useIncomeSources'
import { useBudgetPeople } from '@/hooks/useBudgetPeople'
import { useCurrency } from '@/hooks/useCurrency'
import { useIsFreeTier } from '@/hooks/useUserPlan'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { isEnabled } from '@/lib/config/features'
import { savingsSourcesQueryKey } from '@/hooks/useSavingsSources'
import { logger } from '@/lib/logger'
import { formatMoney, formatMoneyFromNumber } from '@/lib/format'
import { useMyBudgetPerson } from '@/hooks/useMyBudgetPerson'
import { isMineOrUnattributed } from '@/lib/focusedView'
import { EditIncomeModal } from './modals/EditIncomeModal'
import { AddIncomeDialog } from './modals/AddIncomeDialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'

interface Props {
  budgetProfileId: string
  showBeforeTax?: boolean
  addOpen?: boolean
  onAddClose?: () => void
  canEdit?: boolean
}

export function IncomePanel({ budgetProfileId, showBeforeTax, addOpen = false, onAddClose, canEdit = true }: Props) {
  const t = useTranslations('budget.income')
  const { showError } = useSnackbar()
  const isFree = useIsFreeTier()
  const { currency, locale } = useCurrency()
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()
  const queryClient = useQueryClient()
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null)
  const [localAddOpen, setLocalAddOpen] = useState(false)
  const isAddOpen = addOpen || localAddOpen

  const { sources: allSources, isLoading } = useIncomeSources(budgetProfileId)

  const { people } = useBudgetPeople(budgetProfileId)

  function invalidateIncome() {
    queryClient.invalidateQueries({ queryKey: incomeSourcesQueryKey(budgetProfileId) })
  }

  const { mutateAsync: doDelete } = useMutation({
    mutationFn: async (id: bigint) => {
      if (isEnabled('csharpBudget')) {
        const { error } = await dotnetClient.DELETE('/rest/v1/budgets/{id}/income-sources/{sourceId}', {
          params: { path: { id: budgetProfileId, sourceId: Number(id) } },
        })
        if (error) throw new Error(error.message)
        return
      }
      await client.deleteIncomeSource({ id, budgetProfileId })
    },
  })

  function invalidateSavings() {
    queryClient.invalidateQueries({ queryKey: savingsSourcesQueryKey(budgetProfileId) })
  }

  async function handleDelete(id: bigint) {
    try {
      await doDelete(id)
      logger.info('income.delete', { budgetProfileId, id: id.toString() })
      invalidateIncome()
      invalidateSavings()
    } catch (err) {
      showError(err)
    }
  }

  const { person: myPerson } = useMyBudgetPerson(budgetProfileId)
  const sources = myPerson?.focusedViewEnabled
    ? allSources.filter((s) => isMineOrUnattributed(s.budgetPersonId, myPerson.id))
    : allSources
  const personMap = new Map(people.map((p) => [p.id.toString(), p.userName]))
  const total = sources.reduce(
    (sum, s) => sum + Number(s.defaultAmount?.units ?? 0) + (s.defaultAmount?.nanos ?? 0) / 1e9,
    0
  )

  if (isLoading) return <CircularProgress size={20} />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>{t('title')}</Typography>
          {canEdit && (
            <IconButton size="small" onClick={() => setLocalAddOpen(true)}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          {isFree && canEdit && (
            <Typography variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
              ({t('freeTierNote')})
            </Typography>
          )}
        </Box>
        <Typography variant="subtitle2" color="success.main">
          {formatMoneyFromNumber(total, currency, locale)} {t('perMonth')}
        </Typography>
      </Box>
      {sources.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('empty')}</Typography>
      ) : (
        <List dense disablePadding>
          {sources.map((src) => {
            const personName = src.budgetPersonId !== 0n
              ? personMap.get(src.budgetPersonId.toString())
              : undefined
            return (
              <ListItem
                key={src.id.toString()}
                disableGutters
                secondaryAction={
                  canEdit ? (
                    <Box>
                      <IconButton size="small" onClick={() => setEditingSource(src)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(src.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : undefined
                }
              >
                <ListItemText
                  primary={src.name}
                  secondary={
                    <>
                      {formatMoney(src.defaultAmount?.units ?? 0n, src.defaultAmount?.nanos ?? 0, currency, locale)}
                      {personName && <> · {personName}</>}
                    </>
                  }
                />
              </ListItem>
            )
          })}
        </List>
      )}

      {isAddOpen && (
        <AddIncomeDialog
          budgetProfileId={budgetProfileId}
          showBeforeTax={showBeforeTax}
          onClose={() => { setLocalAddOpen(false); onAddClose?.() }}
          onDone={() => { setLocalAddOpen(false); onAddClose?.(); invalidateIncome(); invalidateSavings() }}
        />
      )}

      {editingSource && (
        <EditIncomeModal
          budgetProfileId={budgetProfileId}
          source={editingSource}
          showBeforeTax={showBeforeTax}
          onClose={() => setEditingSource(null)}
          onDone={() => {
            setEditingSource(null)
            invalidateIncome()
            invalidateSavings()
          }}
        />
      )}
    </Box>
  )
}
