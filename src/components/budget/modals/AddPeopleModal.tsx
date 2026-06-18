'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
  budgetId: string
  embedded?: boolean
  onSkip: () => void
  onDone: () => void
}

export function AddPeopleModal({ budgetId, onSkip, onDone }: Props) {
  const { showError } = useSnackbar()
  const [name, setName] = useState('')
  const [people, setPeople] = useState<string[]>([])
  const client = useClient(BudgetService)
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (names: string[]) =>
      client.addBudgetPeople({ budgetId, people: names.map((userName) => ({ userName, userId: '' })) }),
  })

  function addPerson() {
    if (name.trim()) {
      setPeople((p) => [...p, name.trim()])
      setName('')
    }
  }

  async function handleSave() {
    if (people.length === 0) return onDone()
    try {
      await mutateAsync(people)
      logger.info('budget.people.add', { budgetId, count: people.length })
      onDone()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Add people who share this budget. You can skip this step.
      </Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPerson()}
          fullWidth
          size="small"
        />
        <Button variant="outlined" onClick={addPerson} disabled={!name.trim()}>Add</Button>
      </Stack>
      {people.length > 0 && (
        <List dense>
          {people.map((p, i) => (
            <ListItem key={i} secondaryAction={
              <IconButton edge="end" onClick={() => setPeople((prev) => prev.filter((_, idx) => idx !== i))}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }>
              <ListItemText primary={p} />
            </ListItem>
          ))}
        </List>
      )}
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onSkip} color="inherit">Skip</Button>
        <Button variant="contained" onClick={handleSave} disabled={isPending}>
          {people.length === 0 ? 'Skip' : isPending ? 'Saving…' : 'Save & Continue'}
        </Button>
      </Stack>
    </Stack>
  )
}
