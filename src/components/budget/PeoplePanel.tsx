'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import type { BudgetPerson } from '@/gen/wellspent/v1/budget_pb'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useDotnetRestClient } from '@/hooks/useDotnetRestClient'
import { useBudgetProfile } from '@/hooks/useBudgetProfile'
import { useBudgetPeople, budgetPeopleQueryKey } from '@/hooks/useBudgetPeople'
import { useIncomeSources, incomeSourcesQueryKey } from '@/hooks/useIncomeSources'
import { usePaymentMethods, paymentMethodsQueryKey } from '@/hooks/usePaymentMethods'
import { useIsFreeTier } from '@/hooks/useUserPlan'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { unwrap } from '@/lib/api/rest'
import { budgetPersonFromRest, budgetPersonRoleToRest } from '@/lib/budget/budgetTransport'
import { isEnabled } from '@/lib/config/features'
import { logger } from '@/lib/logger'
import { useRoleLabel } from './peoplePanel/useRoleLabel'
import { EditColorDialog } from './peoplePanel/EditColorDialog'
import { RemovePersonDialog } from './peoplePanel/RemovePersonDialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import Tooltip from '@mui/material/Tooltip'
import DeleteIcon from '@mui/icons-material/Delete'
import PaletteIcon from '@mui/icons-material/Palette'

interface Props {
  budgetProfileId: string
  canManageUsers?: boolean
}

export function PeoplePanel({ budgetProfileId, canManageUsers = true }: Props) {
  const t = useTranslations('budget.people')
  const { showError, showSuccess } = useSnackbar()
  const isFree = useIsFreeTier()
  const roleLabel = useRoleLabel()
  const client = useClient(BudgetService)
  const dotnetClient = useDotnetRestClient()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [pendingNames, setPendingNames] = useState<string[]>([])
  const [removingPerson, setRemovingPerson] = useState<BudgetPerson | null>(null)
  const [editingPerson, setEditingPerson] = useState<BudgetPerson | null>(null)

  const { profile } = useBudgetProfile(budgetProfileId)
  const budgetOwnerId = profile?.userId ?? ''

  const { people, isLoading } = useBudgetPeople(budgetProfileId)

  const { methods: paymentMethods } = usePaymentMethods(budgetProfileId)

  const { sources: incomeSources } = useIncomeSources(budgetProfileId)

  function invalidatePeople() {
    queryClient.invalidateQueries({ queryKey: budgetPeopleQueryKey(budgetProfileId) })
  }

  const { mutateAsync: doAdd, isPending: isAdding } = useMutation({
    mutationFn: async (names: string[]) => {
      if (isEnabled('csharpBudget')) {
        return unwrap(await dotnetClient.POST('/rest/v1/budgets/{id}/people', {
          params: { path: { id: budgetProfileId } },
          body: { people: names.map((userName) => ({ userName })) },
        }))
      }
      return client.addBudgetPeople({ budgetProfileId, people: names.map((userName) => ({ userName, userId: '' })) })
    },
    onSuccess: invalidatePeople,
  })

  const { mutateAsync: doRemove, isPending: isRemoving } = useMutation({
    mutationFn: async ({ personId, replacementPersonId, replacementPaymentMethodId }: {
      personId: bigint
      replacementPersonId: bigint
      replacementPaymentMethodId: string
    }) => {
      if (isEnabled('csharpBudget')) {
        const { error } = await dotnetClient.DELETE('/rest/v1/budgets/{id}/people/{personId}', {
          params: {
            path: { id: budgetProfileId, personId: Number(personId) },
            query: {
              replacementPersonId: replacementPersonId !== 0n ? Number(replacementPersonId) : undefined,
              replacementPaymentMethodId: replacementPaymentMethodId || undefined,
            },
          },
        })
        if (error) throw new Error(error.message)
        return
      }
      await client.removeBudgetPerson({ budgetProfileId, personId, replacementPersonId, replacementPaymentMethodId })
    },
    onSuccess: () => {
      invalidatePeople()
      queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey(budgetProfileId) })
      queryClient.invalidateQueries({ queryKey: incomeSourcesQueryKey(budgetProfileId) })
    },
  })

  const { mutateAsync: doUpdatePerson, isPending: isUpdatingPerson } = useMutation({
    mutationFn: async (vars: { id: bigint; budgetProfileId: string; color: string }) => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.PUT('/rest/v1/budgets/{id}/people/{personId}', {
          params: { path: { id: vars.budgetProfileId, personId: Number(vars.id) } },
          body: { color: vars.color },
        }))
        return { person: budgetPersonFromRest(res.person) }
      }
      return client.updateBudgetPerson(vars)
    },
    onSuccess: invalidatePeople,
  })

  const { mutateAsync: doUpdateRole } = useMutation({
    mutationFn: async (vars: { personId: bigint; role: BudgetRole }) => {
      if (isEnabled('csharpBudget')) {
        const res = unwrap(await dotnetClient.PUT('/rest/v1/budgets/{id}/people/{personId}/role', {
          params: { path: { id: budgetProfileId, personId: Number(vars.personId) } },
          body: { role: budgetPersonRoleToRest(vars.role) },
        }))
        return { person: budgetPersonFromRest(res.person) }
      }
      return client.updateBudgetPersonRole({ budgetProfileId, personId: vars.personId, role: vars.role })
    },
    onSuccess: invalidatePeople,
  })

  function addToList() {
    if (name.trim()) {
      setPendingNames((p) => [...p, name.trim()])
      setName('')
    }
  }

  async function handleAdd() {
    if (pendingNames.length === 0) return
    try {
      await doAdd(pendingNames)
      logger.info('budget.people.add', { budgetProfileId, count: pendingNames.length })
      showSuccess(`Added ${pendingNames.length} person${pendingNames.length > 1 ? 's' : ''}`)
      setPendingNames([])
    } catch (err) {
      showError(err)
    }
  }

  async function handleRemove(replacementPersonId: bigint, replacementPmId: string) {
    if (!removingPerson) return
    try {
      await doRemove({
        personId: removingPerson.id,
        replacementPersonId,
        replacementPaymentMethodId: replacementPmId,
      })
      logger.info('budget.people.remove', {
        budgetProfileId,
        personId: removingPerson.id.toString(),
        withReplacement: replacementPersonId !== 0n,
      })
      showSuccess(`${removingPerson.userName} removed`)
      setRemovingPerson(null)
    } catch (err) {
      showError(err)
    }
  }

  async function handleUpdateColor(color: string) {
    if (!editingPerson) return
    try {
      await doUpdatePerson({ id: editingPerson.id, budgetProfileId, color })
      logger.info('budget.people.update_color', { budgetProfileId, personId: editingPerson.id.toString() })
      showSuccess(`Color updated for ${editingPerson.userName}`)
      setEditingPerson(null)
    } catch (err) {
      showError(err)
    }
  }

  async function handleUpdateRole(personId: bigint, role: BudgetRole) {
    try {
      await doUpdateRole({ personId, role })
      logger.info('budget.people.update_role', { budgetProfileId, personId: personId.toString(), role })
      showSuccess('Role updated')
    } catch (err) {
      showError(err)
    }
  }

  const isAtPeopleLimit = isFree && people.length >= 2

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>Members</Typography>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : people.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No people yet.</Typography>
        ) : (
          <List dense disablePadding>
            {people.map((p) => {
              const isOwner = p.userId !== '' && p.userId === budgetOwnerId
              return (
                <ListItem
                  key={p.id.toString()}
                  disableGutters
                  secondaryAction={
                    canManageUsers ? (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => setEditingPerson(p)} aria-label="set color">
                          <PaletteIcon fontSize="small" sx={p.color ? { color: p.color } : {}} />
                        </IconButton>
                        {!isOwner && (
                          <IconButton size="small" onClick={() => setRemovingPerson(p)} aria-label="remove">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ) : undefined
                  }
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        {p.color && (
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
                        )}
                        <span>{p.userName}</span>
                        {canManageUsers && !isOwner && p.userId && p.role !== BudgetRole.UNSPECIFIED ? (
                          <FormControl size="small">
                            <Select
                              value={p.role}
                              onChange={(e) => handleUpdateRole(p.id, e.target.value as BudgetRole)}
                              size="small"
                              sx={{ fontSize: '0.75rem', '.MuiSelect-select': { py: 0.5 } }}
                            >
                              <MenuItem value={BudgetRole.ADMIN}>{roleLabel(BudgetRole.ADMIN)}</MenuItem>
                              <MenuItem value={BudgetRole.COLLABORATOR}>{roleLabel(BudgetRole.COLLABORATOR)}</MenuItem>
                              <MenuItem value={BudgetRole.VIEWER}>{roleLabel(BudgetRole.VIEWER)}</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={roleLabel(p.role)}
                            size="small"
                            color={isOwner ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    }
                    secondary={p.userId ? undefined : 'Pending invite'}
                  />
                </ListItem>
              )
            })}
          </List>
        )}
      </Box>

      {canManageUsers && (
        <>
          <Divider />

          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Add people</Typography>
            {isAtPeopleLimit && (
              <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
                {t('freeTierLimit')}
              </Typography>
            )}
            <Stack direction="row" spacing={1} mb={1}>
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isAtPeopleLimit && addToList()}
                size="small"
                fullWidth
                placeholder="e.g. Jane"
                disabled={isAtPeopleLimit}
              />
              <Tooltip title={isAtPeopleLimit ? t('freeTierLimit') : ''} disableHoverListener={!isAtPeopleLimit}>
                <span>
                  <Button variant="outlined" onClick={addToList} disabled={!name.trim() || isAtPeopleLimit}>Add</Button>
                </span>
              </Tooltip>
            </Stack>
            {pendingNames.length > 0 && (
              <List dense disablePadding sx={{ mb: 1 }}>
                {pendingNames.map((n, i) => (
                  <ListItem key={i} disableGutters secondaryAction={
                    <IconButton size="small" onClick={() => setPendingNames((prev) => prev.filter((_, idx) => idx !== i))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }>
                    <ListItemText primary={n} secondary="pending" />
                  </ListItem>
                ))}
              </List>
            )}
            <LoadingButton
              variant="contained"
              onClick={handleAdd}
              disabled={pendingNames.length === 0}
              loading={isAdding}
              fullWidth
            >
              {pendingNames.length > 0 ? `Save (${pendingNames.length})` : 'Save'}
            </LoadingButton>
          </Box>
        </>
      )}

      <EditColorDialog
        person={editingPerson}
        isSaving={isUpdatingPerson}
        onCancel={() => setEditingPerson(null)}
        onConfirm={handleUpdateColor}
      />

      <RemovePersonDialog
        person={removingPerson}
        people={people}
        paymentMethods={paymentMethods}
        incomeSources={incomeSources}
        isRemoving={isRemoving}
        onCancel={() => setRemovingPerson(null)}
        onConfirm={handleRemove}
      />
    </Box>
  )
}
