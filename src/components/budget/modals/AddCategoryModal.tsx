'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/wellspent/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { logger } from '@/lib/logger'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddCategoryModal({ open, onClose, onCreated }: Props) {
  const { showError, showSuccess } = useSnackbar()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const client = useClient(BudgetService)
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: { name: string; color: string }) => client.createCategory(vars),
  })

  async function handleSave() {
    if (!name.trim()) return
    try {
      await mutateAsync({ name, color })
      logger.info('category.create', { name })
      showSuccess(`Category "${name}" created`)
      setName('')
      setColor('')
      onCreated()
    } catch (err) {
      showError(err)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
      <DialogTitle>New Category</DialogTitle>
      <DialogContent>
        <TextField
          label="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          sx={{ mt: 1, mb: 2 }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Color (optional)
        </Typography>
        <ColorPicker value={color} onChange={setColor} />
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
