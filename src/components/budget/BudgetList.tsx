'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { BudgetProfile } from '@/gen/wellspent/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { formatError, isSessionError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import LogoutIcon from '@mui/icons-material/Logout'
import Tooltip from '@mui/material/Tooltip'
import { BudgetSetupFlow } from './BudgetSetupFlow'
import { PeriodRow } from './budgetList/PeriodRow'
import { DeleteBudgetDialog } from './budgetList/DeleteBudgetDialog'
import { groupPeriodsByYear } from './budgetList/periodGrouping'
import { useRouter } from '@/i18n/navigation'

export function BudgetList() {
  const t = useTranslations('budget.list')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const { showError, showSuccess } = useSnackbar()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login', { locale })
  }

  const [setupOpen, setSetupOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BudgetProfile | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['budgets', 'list'],
    queryFn: () => client.listBudgetProfiles({}),
  })

  // At most one owned profile per account — see
  // docs/features/budget-list-view-rework.md.
  const profiles = data?.profiles ?? []
  const profile = profiles[0] as BudgetProfile | undefined

  const { data: periodsData, isLoading: periodsLoading } = useQuery({
    queryKey: ['budget-periods', profile?.id],
    queryFn: () => client.listBudgetPeriods({ budgetProfileId: profile!.id }),
    enabled: !!profile,
  })

  useEffect(() => {
    if (isError && isSessionError(error)) {
      fetch('/api/auth/logout', { method: 'POST' }).then(() => router.push('/login', { locale }))
    }
  }, [isError, error]) // eslint-disable-line react-hooks/exhaustive-deps

  const { mutateAsync: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => client.deleteBudgetProfile({ id }),
  })

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await doDelete(deleteTarget.id)
      logger.info('budget.delete', { budgetId: deleteTarget.id, name: deleteTarget.name })
      showSuccess(`"${deleteTarget.name}" deleted.`)
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['budgets', 'list'] })
    } catch (err) {
      showError(err)
    }
  }

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  if (isError) {
    const message = formatError(error)
    logger.error('budget.list.failed', { error: message })
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error" mb={2}>{message}</Typography>
        <Button variant="outlined" onClick={() => refetch()}>{t('retry')}</Button>
      </Box>
    )
  }

  const yearGroups = groupPeriodsByYear(periodsData?.periods ?? [])
  const years = yearGroups.map((g) => g.year)
  const effectiveYear = selectedYear !== null && years.includes(selectedYear) ? selectedYear : years[0]
  const periodsForYear = yearGroups.find((g) => g.year === effectiveYear)?.periods ?? []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('title')}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {profiles.length === 0 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setSetupOpen(true)}>
              {t('newBudget')}
            </Button>
          )}
          <Tooltip title={tAuth('logout')}>
            <IconButton onClick={handleLogout} aria-label={tAuth('logout')}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {!profile ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="body1" mb={2}>{t('empty')}</Typography>
          <Button variant="outlined" onClick={() => setSetupOpen(true)}>{t('createBudget')}</Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{profile.name}</Typography>
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteTarget(profile)}
              aria-label={t('deleteDialog.title')}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          {periodsLoading ? (
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
                  <PeriodRow key={period.id} profileId={profile.id} period={period} />
                ))}
              </Box>
            </>
          )}
        </>
      )}

      <BudgetSetupFlow
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onComplete={() => {
          setSetupOpen(false)
          refetch()
        }}
      />

      {deleteTarget && (
        <DeleteBudgetDialog
          budget={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </Box>
  )
}
