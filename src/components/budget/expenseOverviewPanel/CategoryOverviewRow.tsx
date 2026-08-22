'use client'

import { useTranslations } from 'next-intl'
import type { Category, BudgetPerson, Transaction, PaymentMethod, CategoryExpenseSummary } from '@/gen/wellspent/v1/budget_pb'
import { parseMoney } from '../expensesPanel/helpers'
import { formatOverviewActual } from './helpers'
import { CategoryTransactionList } from './CategoryTransactionList'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { useCategoryName } from '@/hooks/useCategoryName'

interface Props {
  cat: Category
  people: BudgetPerson[]
  summary: CategoryExpenseSummary
  totalActual: number
  isExpanded: boolean
  onToggle: () => void
  formatMoney: (v: number) => string
  catTransactions: Transaction[]
  categoryMap: Map<number, Category>
  methodMap: Map<string, PaymentMethod>
  personMap: Map<string, BudgetPerson>
}

export function CategoryOverviewRow({
  cat, people, summary, totalActual,
  isExpanded, onToggle, formatMoney,
  catTransactions, categoryMap, methodMap, personMap,
}: Props) {
  const t = useTranslations('budget.overview')
  const categoryName = useCategoryName()
  const actual = parseMoney(summary.actualTotal?.units ?? 0n, summary.actualTotal?.nanos ?? 0)
  const planned = parseMoney(summary.plannedTotal?.units ?? 0n, summary.plannedTotal?.nanos ?? 0)
  const isOver = summary.isOver
  const actualDisplay = formatOverviewActual(actual, planned, isOver, formatMoney)
  const hasPeople = people.length > 1
  const isExpandable = hasPeople || catTransactions.length > 0
  const pct = totalActual > 0 && actual > 0 ? Math.round(actual / totalActual * 100) : null

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: isExpandable ? 'pointer' : 'default' }}
        onClick={isExpandable ? onToggle : undefined}
      >
        <TableCell sx={{ width: 36, py: 0.5, pr: 0 }}>
          {isExpandable && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggle() }}>
              {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {cat.color && (
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
            )}
            {categoryName(cat)}
            {pct !== null && (
              <Chip label={`${pct}%`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />
            )}
            {cat.isSystem && (
              <Chip label={t('global')} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 16 }} />
            )}
          </Box>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" sx={{ color: actualDisplay.color, fontWeight: actual !== 0 ? 600 : 400 }}>
            {actualDisplay.text}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" color="text.secondary">
            {planned > 0 ? formatMoney(planned) : '—'}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {isOver && (
            <Chip
              label={`+${formatMoney(actual - planned)}`}
              size="small"
              color="error"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          )}
        </TableCell>
      </TableRow>

      {hasPeople && isExpanded && summary.personBreakdowns.map((pb) => {
        const p = personMap.get(pb.budgetPersonId.toString())
        if (!p) return null
        const personActual = parseMoney(pb.actualTotal?.units ?? 0n, pb.actualTotal?.nanos ?? 0)
        const personPlanned = parseMoney(pb.plannedTotal?.units ?? 0n, pb.plannedTotal?.nanos ?? 0)
        const isPersonOver = personPlanned > 0 && personActual > personPlanned
        const personDisplay = formatOverviewActual(personActual, personPlanned, isPersonOver, formatMoney)
        return (
          <TableRow key={pb.budgetPersonId.toString()} sx={{ bgcolor: 'action.hover' }}>
            <TableCell sx={{ py: 0.5, pr: 0 }} />
            <TableCell sx={{ py: 0.5, pl: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {p.color && (
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
                )}
                <Typography variant="body2" sx={{ color: p.color || 'text.primary' }} noWrap>
                  {p.userName}
                </Typography>
              </Box>
            </TableCell>
            <TableCell align="right" sx={{ py: 0.5 }}>
              <Typography variant="body2" sx={{ color: personDisplay.color }}>
                {personDisplay.text}
              </Typography>
            </TableCell>
            <TableCell align="right" sx={{ py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {personPlanned > 0 ? formatMoney(personPlanned) : '—'}
              </Typography>
            </TableCell>
            <TableCell sx={{ py: 0.5 }}>
              {isPersonOver && (
                <Chip
                  label={`+${formatMoney(personActual - personPlanned)}`}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </TableCell>
          </TableRow>
        )
      })}
      {isExpanded && catTransactions.length > 0 && (
        <TableRow>
          <TableCell colSpan={5} sx={{ p: 0 }}>
            <CategoryTransactionList
              transactions={catTransactions}
              isMobile={false}
              categoryMap={categoryMap}
              methodMap={methodMap}
              personMap={personMap}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
