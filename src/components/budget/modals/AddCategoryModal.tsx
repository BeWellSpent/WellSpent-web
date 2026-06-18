'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddCategoryModal({ open, onClose, onCreated }: Props) {
  const { showError, showSuccess } = useSnackbar()
  const [name, setName] = useState('')
  const client = useClient(BudgetService)
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (categoryName: string) => client.createCategory({ name: categoryName }),
  })

  async function handleSave() {
    if (!name.trim()) return
    try {
      await mutateAsync(name)
      logger.info('category.create', { name })
      showSuccess(`Category "${name}" created`)
      setName('')
      onCreated()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New Category</DialogTitle>
      <DialogContent>
        <TextField
          label="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          sx={{ mt: 1 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() || isPending}>
          {isPending ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
