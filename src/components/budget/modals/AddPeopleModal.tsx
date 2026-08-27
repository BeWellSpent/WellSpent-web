'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { InviteService } from '@/gen/wellspent/v1/invite_connect'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import { INVITABLE_ROLES, isValidInviteEmail, type PendingPerson } from './addPeople/pendingPerson'
import { PendingPersonList } from './addPeople/PendingPersonList'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormHelperText from '@mui/material/FormHelperText'

interface Props {
  budgetProfileId: string
  onSkip: () => void
  onDone: () => void
}

export function AddPeopleModal({ budgetProfileId, onSkip, onDone }: Props) {
  const t = useTranslations('budget.setup.people')
  const tActions = useTranslations('budget.setup.actions')
  const tRoles = useTranslations('budget.invites.roles')
  const { showError, showSuccess } = useSnackbar()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<BudgetRole>(BudgetRole.COLLABORATOR)
  const [pending, setPending] = useState<PendingPerson[]>([])

  const client = useClient(BudgetService)
  const inviteClient = useClient(InviteService)
  const queryClient = useQueryClient()

  const { data: existingData, isLoading } = useQuery({
    queryKey: ['budget-people', budgetProfileId],
    queryFn: () => client.listBudgetPeople({ budgetProfileId }),
  })
  const existing = existingData?.people ?? []

  const { mutateAsync: addPeople, isPending } = useMutation({
    mutationFn: (people: PendingPerson[]) =>
      client.addBudgetPeople({
        budgetProfileId,
        people: people.map((p) => ({ userName: p.name, userId: '' })),
      }),
  })

  const emailError = email.trim() !== '' && !isValidInviteEmail(email)

  function addPerson() {
    const trimmedName = name.trim()
    if (!trimmedName || emailError) return
    if (pending.some((p) => p.name === trimmedName)) return
    setPending((prev) => [...prev, { name: trimmedName, email: email.trim(), role }])
    setName('')
    setEmail('')
    setRole(BudgetRole.COLLABORATOR)
  }

  /**
   * Creates the people, then invites the ones that were given an email.
   *
   * The invite is sent here rather than at the end of the wizard on purpose:
   * `SendBudgetInvite` needs the `budget_person_id` that only exists once the
   * person is created, and deferring it to the final step would surface a
   * failed send on a screen that has already moved on from the person it
   * concerns.
   *
   * A failed invite is reported but does not fail the step. The person was
   * created either way, and the invite can be re-sent from the Invites panel —
   * blocking setup on an email that did not go out would be worse.
   */
  async function handleSave() {
    if (pending.length === 0) return onDone()
    try {
      const created = await addPeople(pending)
      logger.info('budget.people.add', { budgetProfileId, count: pending.length })

      const invitable = pending
        .map((p, index) => ({ person: p, created: created.people[index] }))
        .filter(({ person }) => person.email !== '')

      for (const { person, created: createdPerson } of invitable) {
        try {
          await inviteClient.sendBudgetInvite({
            budgetProfileId,
            email: person.email,
            role: person.role,
            budgetPersonId: createdPerson?.id ?? 0n,
          })
          logger.info('invite.send', { budgetProfileId, email: person.email, role: person.role })
          showSuccess(t('inviteSent', { email: person.email }))
        } catch (err) {
          logger.error('invite.send.failed', { budgetProfileId, email: person.email })
          showError(err)
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['budget-people', budgetProfileId] })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">{t('help')}</Typography>

      {isLoading ? (
        <CircularProgress size={20} />
      ) : existing.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {t('existing')}
          </Typography>
          <List dense disablePadding>
            {existing.map((p) => (
              <ListItem key={p.id.toString()} disableGutters>
                <ListItemText primary={p.userName} />
                {p.userId && <Chip label={t('you')} size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />}
              </ListItem>
            ))}
          </List>
          <Divider />
        </>
      )}

      <TextField
        label={t('name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        size="small"
        placeholder={t('namePlaceholder')}
      />

      <TextField
        label={t('email')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        size="small"
        type="email"
        error={emailError}
        helperText={emailError ? t('invalidEmail') : t('emailHelp')}
      />

      {/* Only meaningful alongside an email — a person with no account has
          nothing to hold a role. Shown disabled rather than hidden so the
          field does not appear and disappear as the email is typed. */}
      <FormControl fullWidth size="small" disabled={email.trim() === ''}>
        <InputLabel>{t('role')}</InputLabel>
        <Select
          label={t('role')}
          value={role}
          onChange={(e) => setRole(e.target.value as BudgetRole)}
        >
          {INVITABLE_ROLES.map((r) => (
            <MenuItem key={r} value={r}>
              {r === BudgetRole.COLLABORATOR ? tRoles('collaborator') : tRoles('viewer')}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>
          {role === BudgetRole.COLLABORATOR ? t('roleHelp.collaborator') : t('roleHelp.viewer')}
        </FormHelperText>
      </FormControl>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="outlined" onClick={addPerson} disabled={!name.trim() || emailError}>
          {tActions('add')}
        </Button>
      </Stack>

      <PendingPersonList
        people={pending}
        onRemove={(index) => setPending((prev) => prev.filter((_, i) => i !== index))}
      />

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onSkip} color="inherit">{tActions('skip')}</Button>
        <LoadingButton variant="contained" onClick={handleSave} loading={isPending}>
          {pending.length === 0 ? tActions('continue') : tActions('saveAndContinue')}
        </LoadingButton>
      </Stack>
    </Stack>
  )
}
