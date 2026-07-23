'use client'

import { Fragment, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/hooks/useCurrency'
import { formatMoneyFromNumber } from '@/lib/format'
import type { Transaction, Category, PaymentMethod, BudgetPerson, FixedExpense } from '@/gen/wellspent/v1/budget_pb'
import { txAmount, txPlannedAmount, paymentProgress, formatVariableAmount, formatDate } from './helpers'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

interface TxRowProps {
  tx: Transaction
  isFixed: boolean
  isMobile: boolean
  linkedVariableTxs: Transaction[]
  categoryMap: Map<number, Category>
  methodMap: Map<string, PaymentMethod>
  personMap: Map<string, BudgetPerson>
  fixedExpenseMap?: Map<string, FixedExpense>
  pendingReviewName?: string
  colSpan: number
  actions: React.ReactNode
}

export function TxRow({
  tx, isFixed, isMobile,
  linkedVariableTxs,
  categoryMap, methodMap, personMap, fixedExpenseMap,
  pendingReviewName,
  colSpan,
  actions,
}: TxRowProps) {
  const t = useTranslations('budget.transactions')
  const { currency, locale } = useCurrency()
  const formatMoney = (v: number) => formatMoneyFromNumber(v, currency, locale)
  const [expanded, setExpanded] = useState(false)

  const category = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined
  const method = tx.paymentMethodId ? methodMap.get(tx.paymentMethodId) : undefined
  const person = method?.budgetPersonId && method.budgetPersonId !== 0n
    ? personMap.get(method.budgetPersonId.toString())
    : undefined
  const fe = isFixed && tx.fixedExpenseId ? fixedExpenseMap?.get(tx.fixedExpenseId) : undefined
  const progress = fe ? paymentProgress(fe) : null
  const hasLinked = linkedVariableTxs.length > 0

  const expandBtn = hasLinked ? (
    <IconButton size="small" onClick={() => setExpanded((v) => !v)} sx={{ p: 0 }}>
      {expanded ? <KeyboardArrowUpIcon sx={{ fontSize: 16 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
    </IconButton>
  ) : null

  const linkedSubRows = hasLinked && expanded
    ? linkedVariableTxs.map((varTx) => {
        const varCategory = varTx.categoryId ? categoryMap.get(varTx.categoryId) : undefined
        const varMethod = varTx.paymentMethodId ? methodMap.get(varTx.paymentMethodId) : undefined
        const varPerson = varMethod?.budgetPersonId && varMethod.budgetPersonId !== 0n
          ? personMap.get(varMethod.budgetPersonId.toString())
          : undefined
        const { text: amtText, color: amtColor } = formatVariableAmount(txAmount(varTx), currency, locale)
        return (
          <TableRow key={varTx.id} sx={{ bgcolor: 'action.hover' }}>
            <TableCell colSpan={colSpan} sx={{ pl: isMobile ? 4 : 5, py: 0.75 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={500}>{varTx.name}</Typography>
                <Typography variant="body2" color={amtColor ?? 'inherit'}>{amtText}</Typography>
                {formatDate(varTx.date) && (
                  <Typography variant="caption" color="text.secondary">{formatDate(varTx.date)}</Typography>
                )}
                {varCategory && (
                  <Typography variant="caption" sx={{ color: varCategory.color || 'text.secondary' }}>{varCategory.name}</Typography>
                )}
                {varMethod && (
                  <Typography variant="caption" sx={{ color: varMethod.color || 'inherit' }}>{varMethod.alias || varMethod.name}</Typography>
                )}
                {varPerson && (
                  <Typography variant="caption" sx={{ color: varPerson.color || 'text.secondary' }}>{varPerson.userName}</Typography>
                )}
              </Box>
            </TableCell>
          </TableRow>
        )
      })
    : null

  if (isMobile) {
    return (
      <Fragment>
        <TableRow hover>
          <TableCell>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {expandBtn}
                <Typography variant="body2" fontWeight={500}>{tx.name}</Typography>
                {progress && (
                  <Typography variant="caption" color="text.secondary">({progress})</Typography>
                )}
                {pendingReviewName && (
                  <Tooltip title={t('linkedToFixedTooltip', { name: pendingReviewName })}>
                    <Typography variant="caption" color="text.secondary" sx={{ cursor: 'default' }}>
                      ({t('linkedToFixed')})
                    </Typography>
                  </Tooltip>
                )}
              </Box>
              {(method || person) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {method && (
                    <Typography variant="caption" sx={{ color: method.color || 'text.secondary' }}>{method.alias || method.name}</Typography>
                  )}
                  {method && person && (
                    <Typography variant="caption" color="text.secondary">·</Typography>
                  )}
                  {person && (
                    <Typography variant="caption" sx={{ color: person.color || 'text.secondary' }}>{person.userName}</Typography>
                  )}
                </Box>
              )}
              {category && (
                <Typography variant="caption" sx={{ color: category.color || 'text.secondary' }}>{category.name}</Typography>
              )}
            </Box>
          </TableCell>
          <TableCell align="right" sx={{ whiteSpace: 'nowrap', verticalAlign: 'top', pt: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {isFixed ? (
                <>
                  <Typography variant="body2">{formatMoney(txPlannedAmount(tx))}</Typography>
                  {tx.isPaid && (
                    <Typography variant="caption" color="success.main">
                      {t('paid')}: {formatMoney(txAmount(tx))}
                    </Typography>
                  )}
                </>
              ) : (() => {
                const { text, color } = formatVariableAmount(txAmount(tx), currency, locale)
                return <Typography variant="body2" color={color ?? 'inherit'}>{text}</Typography>
              })()}
            </Box>
          </TableCell>
          {actions && (
            <TableCell align="right" sx={{ whiteSpace: 'nowrap', verticalAlign: 'top', pt: 0.5 }}>
              {actions}
            </TableCell>
          )}
        </TableRow>
        {linkedSubRows}
      </Fragment>
    )
  }

  // Desktop
  return (
    <Fragment>
      <TableRow hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {expandBtn}
            <Typography variant="body2" fontWeight={500}>{tx.name}</Typography>
            {progress && (
              <Typography variant="caption" color="text.secondary">({progress})</Typography>
            )}
            {pendingReviewName && (
              <Tooltip title={t('linkedToFixedTooltip', { name: pendingReviewName })}>
                <Typography variant="caption" color="text.secondary" sx={{ cursor: 'default' }}>
                  ({t('linkedToFixed')})
                </Typography>
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell>
          {category && (
            <Typography variant="body2" sx={{ color: category.color || 'text.secondary' }}>{category.name}</Typography>
          )}
        </TableCell>
        <TableCell>
          {method && (
            <Typography variant="body2" sx={{ color: method.color || 'inherit' }}>{method.alias || method.name}</Typography>
          )}
        </TableCell>
        <TableCell>
          {person && (
            <Typography variant="body2" sx={{ color: person.color || 'text.secondary' }}>{person.userName}</Typography>
          )}
        </TableCell>
        {isFixed ? (
          <>
            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
              {formatMoney(txPlannedAmount(tx))}
            </TableCell>
            <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: tx.isPaid ? 'success.main' : 'text.disabled' }}>
              {tx.isPaid ? formatMoney(txAmount(tx)) : '—'}
            </TableCell>
          </>
        ) : (
          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
            {(() => {
              const { text, color } = formatVariableAmount(txAmount(tx), currency, locale)
              return <Typography variant="body2" component="span" color={color ?? 'inherit'}>{text}</Typography>
            })()}
          </TableCell>
        )}
        {actions && <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{actions}</TableCell>}
      </TableRow>
      {linkedSubRows}
    </Fragment>
  )
}
