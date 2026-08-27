'use client'

import { useTranslations } from 'next-intl'
import { BudgetRole } from '@/gen/wellspent/v1/common_pb'
import type { PendingPerson } from './pendingPerson'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
  people: PendingPerson[]
  onRemove: (index: number) => void
}

/** People queued for creation, each showing whether an invite goes with them. */
export function PendingPersonList({ people, onRemove }: Props) {
  const t = useTranslations('budget.setup.people')
  const tRoles = useTranslations('budget.invites.roles')

  if (people.length === 0) return null

  return (
    <List dense disablePadding>
      {people.map((person, i) => (
        <ListItem
          key={`${person.name}-${i}`}
          disableGutters
          secondaryAction={
            <IconButton edge="end" size="small" onClick={() => onRemove(i)} aria-label={t('remove')}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          }
        >
          <ListItemText
            primary={person.name}
            secondary={person.email || undefined}
          />
          {person.email && (
            <Stack direction="row" spacing={0.5} sx={{ mr: 4 }}>
              <Chip
                label={person.role === BudgetRole.COLLABORATOR ? tRoles('collaborator') : tRoles('viewer')}
                size="small"
                variant="outlined"
              />
            </Stack>
          )}
        </ListItem>
      ))}
    </List>
  )
}
