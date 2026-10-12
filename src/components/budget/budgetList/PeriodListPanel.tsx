'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useClient } from '@/hooks/useClient'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useBudgetRole } from '@/hooks/useBudgetRole'
import { useBudgetProfile, budgetProfileQueryKey } from '@/hooks/useBudgetProfile'
import { useBudgetPeriods, budgetPeriodsQueryKey } from '@/hooks/useBudgetPeriods'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { isEnabled } from '@/lib/config/features'
import { budgetProfilesQueryKey } from '@/hooks/useBudgetProfiles'
import { useRouter } from '@/i18n/navigation'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { PeriodRow } from './PeriodRow'
import { DeleteBudgetDialog } from './DeleteBudgetDialog'
import { groupPeriodsByYear } from './periodGrouping'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface Props {
  budgetId: string
}

/**
 * Every period this budget has ever had, grouped by year — plus deleting the
 * budget, which lives here because this is the one budget-level screen left
 * once the list stopped being home.
 *
 * This was the app's home screen until issue #60; the budget itself is home
 * now, and this is where the full history went — reached from the nav's
 * "View all periods". Selecting a period navigates back into the budget with
 * `?period=`, the same param the budget view already reads.
 */
export function PeriodListPanel({ budgetId }: Props) {
  const t = useTranslations('budget.list')
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useSnackbar()
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const myRole = useBudgetRole(budgetId)
  const canManageUsers = myRole === BudgetRole.ADMIN

  const { profile } = useBudgetProfile(budgetId)
  const { periods, isLoading } = useBudgetPeriods(budgetId)

  const { mutateAsync: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      if (isEnabled('csharpBudget')) {
        const { error } = await dotnetClient.DELETE('/rest/v1/budgets/{id}', { params: { path: { id } } })
        if (error) throw new Error(error.message)
        return
      }
      await client.deleteBudgetProfile({ id })
    },
  })

  async function handleDelete() {
    if (!profile) return
    try {
      await doDelete(profile.id)
      logger.info('budget.delete', { budgetId: profile.id, name: profile.name })
      showSuccess(`"${profile.name}" deleted.`)
      setDeleteOpen(false)
      queryClient.invalidateQueries({ queryKey: budgetProfilesQueryKey() })
      queryClient.invalidateQueries({ queryKey: budgetProfileQueryKey(profile.id) })
      queryClient.invalidateQueries({ queryKey: budgetPeriodsQueryKey(profile.id) })
      router.push('/budgets')
    } catch (err) {
      showError(err)
    }
  }

  const yearGroups = groupPeriodsByYear(periods)
  const years = yearGroups.map((g) => g.year)
  const effectiveYear = selectedYear !== null && years.includes(selectedYear) ? selectedYear : years[0]
  const periodsForYear = yearGroups.find((g) => g.year === effectiveYear)?.periods ?? []

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/budgets/${budgetId}`)}
        sx={{ mb: 2 }}
      >
        {t('backToBudget')}
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" fontWeight={700}>{t('allPeriods')}</Typography>
        {canManageUsers && profile && (
          <IconButton
            size="small"
            color="error"
            onClick={() => setDeleteOpen(true)}
            aria-label={t('deleteDialog.title')}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {profile?.name ?? ''}
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
      ) : years.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('noPeriods')}</Typography>
      ) : (
        <>
          <FormControl size="small" sx={{ minWidth: 120, mb: 2 }}>
            <Select
              value={effectiveYear}
              onChange={(e: SelectChangeEvent<number>) => setSelectedYear(Number(e.target.value))}
              aria-label={t('yearPicker')}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            {periodsForYear.map((period) => (
              <PeriodRow key={period.id} profileId={budgetId} period={period} />
            ))}
          </Box>
        </>
      )}

      {deleteOpen && profile && (
        <DeleteBudgetDialog
          budget={profile}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </Box>
  )
}
