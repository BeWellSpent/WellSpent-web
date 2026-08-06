'use client'

import { Fragment, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Transaction, Category, PaymentMethod, BudgetPerson, FixedExpense } from '@/gen/wellspent/v1/budget_pb'
import { TxRow } from './TxRow'
import { type SortKey, splitByPaidStatus, groupTransactionsByDay } from './helpers'
import Typography from '@mui/material/Typography'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

interface FixedExpenseSectionsProps {
  transactions: Transaction[]
  notDueFixedExpenses: FixedExpense[]
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  categoryMap: Map<number, Category>
  methodMap: Map<string, PaymentMethod>
  personMap: Map<string, BudgetPerson>
  isMobile: boolean
  colSpan: number
  linkedVariableByFixedTxId?: Map<string, Transaction[]>
  fixedExpenseMap?: Map<string, FixedExpense>
  pendingReviewMatchByTxId?: Map<string, string>
  buildActions: (tx: Transaction) => React.ReactNode
  renderNotDueRow: (fe: FixedExpense) => React.ReactNode
  emptyLabel: string
}

// Renders the Fixed tab's rows as two sections — Unpaid (always expanded)
// and Paid (collapsed by default, same manual-toggle pattern as TxRow's own
// linked-review expand/collapse) — each independently day-grouped via the
// same helper the flat Variable-tab list uses. "Not due yet" placeholder
// rows stay appended after both, unaffected by the split (they aren't real
// transactions yet, so paid/unpaid doesn't apply to them).
export function FixedExpenseSections({
  transactions, notDueFixedExpenses, sortKey, sortDir,
  categoryMap, methodMap, personMap, isMobile, colSpan,
  linkedVariableByFixedTxId, fixedExpenseMap, pendingReviewMatchByTxId,
  buildActions, renderNotDueRow, emptyLabel,
}: FixedExpenseSectionsProps) {
  const t = useTranslations('budget.transactions')
  const [paidExpanded, setPaidExpanded] = useState(false)

  const { unpaid, paid } = splitByPaidStatus(transactions)
  const unpaidGroups = groupTransactionsByDay(unpaid, sortKey, sortDir, categoryMap, methodMap, personMap)
  const paidGroups = groupTransactionsByDay(paid, sortKey, sortDir, categoryMap, methodMap, personMap)

  function renderRow(tx: Transaction) {
    return (
      <TxRow
        key={tx.id}
        tx={tx}
        isFixed
        isMobile={isMobile}
        linkedVariableTxs={linkedVariableByFixedTxId?.get(tx.id) ?? []}
        categoryMap={categoryMap}
        methodMap={methodMap}
        personMap={personMap}
        fixedExpenseMap={fixedExpenseMap}
        pendingReviewName={pendingReviewMatchByTxId?.get(tx.id)}
        colSpan={colSpan}
        actions={buildActions(tx)}
      />
    )
  }

  if (unpaid.length === 0 && paid.length === 0 && notDueFixedExpenses.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} align="center" sx={{ py: 3, color: 'text.secondary' }}>
          {emptyLabel}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {unpaid.length > 0 && (
        <TableRow>
          <TableCell colSpan={colSpan} sx={{ bgcolor: 'action.hover', py: 0.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              {t('unpaidSection', { count: unpaid.length })}
            </Typography>
          </TableCell>
        </TableRow>
      )}
      {unpaidGroups.map((group) => (
        <Fragment key={`unpaid-${group.day}`}>
          <TableRow>
            <TableCell colSpan={colSpan} sx={{ bgcolor: 'action.hover', py: 0.5 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">{group.label}</Typography>
            </TableCell>
          </TableRow>
          {group.transactions.map(renderRow)}
        </Fragment>
      ))}

      {paid.length > 0 && (
        <TableRow hover onClick={() => setPaidExpanded((v) => !v)} sx={{ cursor: 'pointer' }}>
          <TableCell colSpan={colSpan} sx={{ bgcolor: 'action.hover', py: 0.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small" sx={{ p: 0 }} aria-label={t('paidSection', { count: paid.length })}>
                {paidExpanded ? <KeyboardArrowUpIcon sx={{ fontSize: 16 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
              </IconButton>
              {t('paidSection', { count: paid.length })}
            </Typography>
          </TableCell>
        </TableRow>
      )}
      {paidExpanded && paidGroups.map((group) => (
        <Fragment key={`paid-${group.day}`}>
          <TableRow>
            <TableCell colSpan={colSpan} sx={{ bgcolor: 'action.hover', py: 0.5 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">{group.label}</Typography>
            </TableCell>
          </TableRow>
          {group.transactions.map(renderRow)}
        </Fragment>
      ))}

      {notDueFixedExpenses.map((fe) => renderNotDueRow(fe))}
    </>
  )
}
