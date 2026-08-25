'use client'

import type { Transaction, Category, PaymentMethod, BudgetPerson } from '@/gen/wellspent/v1/budget_pb'
import { TxRow } from '../transactionsPanel/TxRow'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'

interface Props {
  transactions: Transaction[]
  isMobile: boolean
  categoryMap: Map<number, Category>
  methodMap: Map<string, PaymentMethod>
  personMap: Map<string, BudgetPerson>
}

// Desktop column count: name + category + method + person + amount = 5
// Mobile column count: name+details + amount = 2
const DESKTOP_COL_SPAN = 5
const MOBILE_COL_SPAN = 2

/**
 * One owner's transactions inside an expanded category, flat and newest-first.
 *
 * Previously this rendered *every* transaction in the category, day-grouped —
 * which is what made it impossible to tell who had spent what (issue #62). It
 * now renders a single group from `groupTransactionsByOwner`, and the caller
 * places it directly beneath that person's row. The day headers went with the
 * change: the person is the grouping this view is about, and person -> day ->
 * transaction is a lot of nesting for a drill-down.
 */
export function CategoryTransactionList({ transactions, isMobile, categoryMap, methodMap, personMap }: Props) {
  if (transactions.length === 0) return null

  const colSpan = isMobile ? MOBILE_COL_SPAN : DESKTOP_COL_SPAN

  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
      <Table size="small">
        <TableBody>
          {transactions.map((tx) => (
            <TxRow
              key={tx.id}
              tx={tx}
              isFixed={false}
              isMobile={isMobile}
              linkedVariableTxs={[]}
              categoryMap={categoryMap}
              methodMap={methodMap}
              personMap={personMap}
              colSpan={colSpan}
              actions={undefined}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
