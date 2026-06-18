'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { PaymentType } from '@/gen/spendsense/v1/common_pb'
import { useClient } from '@/hooks/useClient'
import { useSnackbar } from '@/components/ui/ErrorSnackbar'
import { logger } from '@/lib/logger'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import AddIcon from '@mui/icons-material/Add'
import CircularProgress from '@mui/material/CircularProgress'

const PAYMENT_TYPES = [
  { value: PaymentType.CASH, label: 'Cash' },
  { value: PaymentType.CREDIT, label: 'Credit' },
  { value: PaymentType.DEBIT, label: 'Debit' },
  { value: PaymentType.DIGITAL_WALLET, label: 'Digital Wallet' },
  { value: PaymentType.BANK_TRANSFER, label: 'Bank Transfer' },
  { value: PaymentType.CRYPTO, label: 'Crypto' },
  { value: PaymentType.INVESTMENT, label: 'Investment' },
]

interface Props {
  budgetId: string
}

export function PaymentMethodsPanel({ budgetId: _ }: Props) {
  const { showError, showSuccess } = useSnackbar()
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<PaymentType>(PaymentType.DEBIT)
  const client = useClient(BudgetService)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: () => client.listPaymentMethods({}),
  })

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (vars: { name: string; type: PaymentType }) => client.createPaymentMethod(vars),
  })

  async function handleCreate() {
    try {
      await mutateAsync({ name, type })
      logger.info('paymentMethod.create', { name })
      showSuccess(`Payment method "${name}" added`)
      setName('')
      setAddOpen(false)
      refetch()
    } catch (err) {
      showError(err)
    }
  }

  if (isLoading) return <CircularProgress size={20} />

  const methods = data?.methods ?? []

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>Payment Methods</Typography>
        <IconButton size="small" onClick={() => setAddOpen(true)}><AddIcon fontSize="small" /></IconButton>
      </Box>
      {methods.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No payment methods yet.</Typography>
      ) : (
        <List dense disablePadding>
          {methods.map((m) => (
            <ListItem key={m.id} disableGutters>
              <ListItemText primary={m.name} />
              <Chip label={PaymentType[m.type]} size="small" variant="outlined" />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth placeholder="e.g. Chase Visa" />
            <TextField select label="Type" value={type} onChange={(e) => setType(Number(e.target.value) as PaymentType)} fullWidth>
              {PAYMENT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || isPending}>
            {isPending ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
