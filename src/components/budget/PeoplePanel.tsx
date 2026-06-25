'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import type { BudgetPerson, PaymentMethod } from '@/gen/spendsense/v1/budget_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
  budgetId: string
}

export function PeoplePanel({ budgetId }: Props) {
  const { showError, showSuccess } = useSnackbar()
  const client = useClient(BudgetService)
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [pendingNames, setPendingNames] = useState<string[]>([])
  const [removingPerson, setRemovingPerson] = useState<BudgetPerson | null>(null)
  const [needsReplacement, setNeedsReplacement] = useState(false)
  const [replacementPersonId, setReplacementPersonId] = useState<bigint>(0n)
  const [replacementPmId, setReplacementPmId] = useState<string>('')

  const { data: budgetData } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => client.getBudget({ id: budgetId }),
  })
  const budgetOwnerId = budgetData?.budget?.userId ?? ''

  const { data, isLoading } = useQuery({
    queryKey: ['budget-people', budgetId],
    queryFn: () => client.listBudgetPeople({ budgetId }),
  })

  const { data: pmData } = useQuery({
    queryKey: ['paymentMethods', budgetId],
    queryFn: () => client.listPaymentMethods({ budgetId }),
  })

  const { data: txData } = useQuery({
    queryKey: ['transactions', budgetId],
    queryFn: () => client.listTransactions({ budgetId }),
  })

  const { data: incomeData } = useQuery({
    queryKey: ['income', budgetId],
    queryFn: () => client.listIncomeEntries({ budgetId }),
  })

  const { mutateAsync: doAdd, isPending: isAdding } = useMutation({
    mutationFn: (names: string[]) =>
      client.addBudgetPeople({ budgetId, people: names.map((userName) => ({ userName, userId: '' })) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-people', budgetId] })
    },
  })

  const { mutateAsync: doRemove, isPending: isRemoving } = useMutation({
    mutationFn: ({ personId, replacementPersonId, replacementPaymentMethodId }: {
      personId: bigint
      replacementPersonId: bigint
      replacementPaymentMethodId: string
    }) => client.removeBudgetPerson({ budgetId, personId, replacementPersonId, replacementPaymentMethodId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-people', budgetId] })
      queryClient.invalidateQueries({ queryKey: ['paymentMethods', budgetId] })
      queryClient.invalidateQueries({ queryKey: ['income', budgetId] })
    },
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
      logger.info('budget.people.add', { budgetId, count: pendingNames.length })
      showSuccess(`Added ${pendingNames.length} person${pendingNames.length > 1 ? 's' : ''}`)
      setPendingNames([])
    } catch (err) {
      showError(err)
    }
  }

  function openRemoveDialog(person: BudgetPerson) {
    // Check if this person has any transactions (via their payment methods) or income entries.
    const personPmIds = new Set(
      (pmData?.methods ?? [])
        .filter((pm) => pm.budgetPersonId === person.id)
        .map((pm) => pm.id)
    )
    const hasTx = (txData?.transactions ?? []).some((t) => personPmIds.has(t.paymentMethodId))
    const hasIncome = (incomeData?.entries ?? []).some((e) => e.budgetPersonId === person.id)

    setRemovingPerson(person)
    setNeedsReplacement(hasTx || hasIncome)
    setReplacementPersonId(0n)
    setReplacementPmId('')
  }

  function closeRemoveDialog() {
    setRemovingPerson(null)
    setNeedsReplacement(false)
    setReplacementPersonId(0n)
    setReplacementPmId('')
  }

  async function handleRemove() {
    if (!removingPerson) return
    if (needsReplacement && (replacementPersonId === 0n || !replacementPmId)) return
    try {
      await doRemove({
        personId: removingPerson.id,
        replacementPersonId: needsReplacement ? replacementPersonId : 0n,
        replacementPaymentMethodId: needsReplacement ? replacementPmId : '',
      })
      logger.info('budget.people.remove', {
        budgetId,
        personId: removingPerson.id.toString(),
        withReplacement: needsReplacement,
      })
      showSuccess(`${removingPerson.userName} removed`)
      closeRemoveDialog()
    } catch (err) {
      showError(err)
    }
  }

  const people = data?.people ?? []

  // People eligible as replacement: not the one being removed
  const replacementPeople = people.filter((p) => removingPerson && p.id !== removingPerson.id)

  // Payment methods belonging to the selected replacement person
  const replacementPersonPMs: PaymentMethod[] = (pmData?.methods ?? []).filter(
    (pm) => pm.budgetPersonId === replacementPersonId
  )

  const canConfirmRemoval = !needsReplacement || (replacementPersonId !== 0n && replacementPmId !== '')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Members list */}
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
                    isOwner ? null : (
                      <IconButton size="small" onClick={() => openRemoveDialog(p)} aria-label="remove">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{p.userName}</span>
                        {isOwner && (
                          <Chip label="Owner" size="small" color="primary" variant="outlined" />
                        )}
                      </Stack>
                    }
                    secondary={p.userId ? 'Registered user' : 'Guest'}
                  />
                </ListItem>
              )
            })}
          </List>
        )}
      </Box>

      <Divider />

      {/* Add people */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>Add people</Typography>
        <Stack direction="row" spacing={1} mb={1}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addToList()}
            size="small"
            fullWidth
            placeholder="e.g. Jane"
          />
          <Button variant="outlined" onClick={addToList} disabled={!name.trim()}>Add</Button>
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
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={pendingNames.length === 0 || isAdding}
          fullWidth
        >
          {isAdding ? 'Saving…' : pendingNames.length > 0 ? `Save (${pendingNames.length})` : 'Save'}
        </Button>
      </Box>

      {/* Remove dialog */}
      <Dialog open={removingPerson !== null} onClose={closeRemoveDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Remove {removingPerson?.userName}</DialogTitle>
        <DialogContent>
          {needsReplacement ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                This person has transactions or income entries. Choose a replacement before removing.
              </Alert>

              <FormControl fullWidth size="small">
                <InputLabel>Step 1 — Replacement person</InputLabel>
                <Select
                  label="Step 1 — Replacement person"
                  value={replacementPersonId === 0n ? '' : replacementPersonId.toString()}
                  onChange={(e) => {
                    setReplacementPersonId(BigInt(e.target.value as string))
                    setReplacementPmId('')
                  }}
                >
                  {replacementPeople.length === 0 ? (
                    <MenuItem disabled value="">No other people in this budget</MenuItem>
                  ) : (
                    replacementPeople.map((p) => (
                      <MenuItem key={p.id.toString()} value={p.id.toString()}>
                        {p.userName}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" disabled={replacementPersonId === 0n}>
                <InputLabel>Step 2 — Replacement payment method</InputLabel>
                <Select
                  label="Step 2 — Replacement payment method"
                  value={replacementPmId}
                  onChange={(e) => setReplacementPmId(e.target.value as string)}
                >
                  {replacementPersonPMs.length === 0 ? (
                    <MenuItem disabled value="">
                      {replacementPersonId === 0n ? 'Select a person first' : 'This person has no payment methods'}
                    </MenuItem>
                  ) : (
                    replacementPersonPMs.map((pm) => (
                      <MenuItem key={pm.id} value={pm.id}>{pm.name}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              {replacementPersonId !== 0n && replacementPersonPMs.length === 0 && (
                <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                  This person has no payment methods. Choose a different replacement.
                </Alert>
              )}
            </Stack>
          ) : (
            <Typography sx={{ mt: 1 }}>
              Remove <strong>{removingPerson?.userName}</strong> from this budget?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRemoveDialog} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRemove}
            disabled={!canConfirmRemoval || isRemoving}
          >
            {isRemoving ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
